class MediaFile(models.Model):
    """
    فایل‌های رسانه‌ای (تصویر، صدا، ویدیو)
    """
    FILE_TYPE_CHOICES = [
        ('IMAGE', 'Image'),
        ('AUDIO', 'Audio'),
        ('VIDEO', 'Video'),
        ('FILE', 'File'),
    ]
    file = models.FileField(upload_to='reports_media/')
    file_type = models.CharField(choices=FILE_TYPE_CHOICES)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    
    transcription = models.TextField(null=True, blank=True, verbose_name="متن تبدیل شده")

    def __str__(self):
        return f"File {self.id} - {self.file_type}"
ووووو# base/chatConsumers.py

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.apps import apps
from django.db import transaction
from django.utils import timezone


class ChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket Consumer برای چت (Private / Group / Task پرونده)
    - TEXT message
    - TASK workflow events (create/forward/approve/reject/complete/comment)
    """

    async def connect(self):
        self.user = self.scope.get("user")
        self.chat_id = int(self.scope["url_route"]["kwargs"]["chat_id"])
        self.chat_group = f"chat_{self.chat_id}"


        if not self.user or not self.user.is_authenticated:
            await self.close(code=4001)
            return

        is_member = await self.is_chat_member(self.chat_id, self.user.id)
        if not is_member:
            await self.close(code=4003)
            return

        await self.channel_layer.group_add(self.chat_group, self.channel_name)
        await self.accept()

        await self.send_json({
            "type": "connection",
            "message": "connected",
            "chat_id": self.chat_id,
        })

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.chat_group, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        try:
            data = json.loads(text_data or "{}")
        except Exception:
            return

        msg_type = data.get("type")
        if msg_type == "ping":
            await self.send_json({
                "type": "pong",
                "server_time": timezone.now().isoformat(),
            })
            return

        if msg_type == "send_message":
            await self.handle_send_message(data)
            return

        # ✅ Task actions over WS
        if msg_type == "task_create":
            await self.handle_task_create(data); return
        if msg_type == "task_forward":
            await self.handle_task_forward(data); return
        if msg_type == "task_approve":
            await self.handle_task_approve(data); return
        if msg_type == "task_reject":
            await self.handle_task_reject(data); return
        if msg_type == "task_complete":
            await self.handle_task_complete(data); return
        if msg_type == "task_comment":
            await self.handle_task_comment(data); return

        await self.send_error("unknown_type", "type نامعتبر است.")

    # ─────────────────────────────────────────────
    # 📨 TEXT Message
    # ─────────────────────────────────────────────

    async def handle_send_message(self, data):
        message_type = data.get("message_type", "TEXT")
        text = (data.get("text") or "").strip()
        local_id = data.get("local_id") # ✅ local_id از کلاینت گرفته میشه

        if message_type != "TEXT":
            await self.send_error("invalid_message_type", "برای send_message فقط TEXT مجاز است.")
            return

        if not text:
            return

        # پیام در دیتابیس ساخته میشه
        message_dict = await self.create_message(
            chat_id=self.chat_id,
            sender_id=self.user.id,
            message_type="TEXT",
            text=text,
            content_obj=None,
        )

        # ✅ local_id رو به payload اضافه می‌کنیم
        payload = self._message_payload(message_dict, local_id=local_id)

        # به همه اعضای گروه می‌فرستیم (از جمله خودمون)
        await self.channel_layer.group_send(
            self.chat_group,
            {"type": "broadcast_message", "payload": payload}
        )
        await self.notify_user_inbox_to_chat_members(payload)
    # ─────────────────────────────────────────────
    # ✅ TASK: Create
    # ─────────────────────────────────────────────

    async def handle_task_create(self, data):
        title = (data.get("title") or "").strip()
        task_type = data.get("task_type")
        assignee_id = data.get("assignee_id")
        note = (data.get("note") or "").strip()
        project_id = data.get("project_id")  # nullable allowed

        if not title or not task_type or not assignee_id:
            await self.send_error("validation", "title/task_type/assignee_id الزامی است.")
            return

        result = await self.db_task_create(
            actor_id=self.user.id,
            chat_id=int(self.chat_id),
            title=title,
            task_type=task_type,
            assignee_id=int(assignee_id),
            project_id=int(project_id) if project_id else None,
            note=note,
        )

        if not result["ok"]:
            await self.send_error(result["code"], result["message"])
            return

        # broadcast message to this chat
        payload = self._message_payload(result["message"])
        await self.channel_layer.group_send(
            self.chat_group,
            {"type": "broadcast_message", "payload": payload}
        )

        # inbox notify to assignee
        await self.notify_user_inbox(result["assignee_id"], {
            "type": "task_inbox",
            "event": "ASSIGNED",
            "task_id": result["task_id"],
            "status": result["task_status"],
            "chat_id": int(self.chat_id),  # ✅ اضافه

        })

    # ─────────────────────────────────────────────
    # ✅ TASK: Forward / Approve / Reject / Complete / Comment
    # ─────────────────────────────────────────────

    async def handle_task_forward(self, data):
        task_id = data.get("task_id")
        to_user_id = data.get("to_user_id")
        note = (data.get("note") or "").strip()

        if not task_id or not to_user_id:
            await self.send_error("validation", "task_id و to_user_id الزامی است.")
            return

        result = await self.db_task_forward(
            actor_id=self.user.id,
            chat_id=int(self.chat_id),
            task_id=int(task_id),
            to_user_id=int(to_user_id),
            note=note,
        )

        if not result["ok"]:
            await self.send_error(result["code"], result["message"])
            return

        payload = self._message_payload(result["message"])
        await self.channel_layer.group_send(
            self.chat_group,
            {"type": "broadcast_message", "payload": payload}
        )

        await self.notify_user_inbox(result["new_assignee_id"], {
            "type": "task_inbox",
            "event": "ASSIGNED",
            "task_id": result["task_id"],
            "status": result["task_status"],
            "chat_id": int(self.chat_id),  # ✅ اضافه
        })

    async def handle_task_approve(self, data):
        await self._handle_task_simple_action(data, action="APPROVE")

    async def handle_task_reject(self, data):
        await self._handle_task_simple_action(data, action="REJECT")

    async def handle_task_complete(self, data):
        await self._handle_task_simple_action(data, action="COMPLETE")

    async def handle_task_comment(self, data):
        await self._handle_task_simple_action(data, action="COMMENT")

    async def _handle_task_simple_action(self, data, action: str):
        task_id = data.get("task_id")
        note = (data.get("note") or "").strip()

        if not task_id:
            await self.send_error("validation", "task_id الزامی است.")
            return

        result = await self.db_task_action(
            actor_id=self.user.id,
            chat_id=int(self.chat_id),
            task_id=int(task_id),
            action=action,
            note=note,
        )

        if not result["ok"]:
            await self.send_error(result["code"], result["message"])
            return

        payload = self._message_payload(result["message"])
        await self.channel_layer.group_send(
            self.chat_group,
            {"type": "broadcast_message", "payload": payload}
        )

        # inbox notify (اختیاری): برای REJECT/APPROVE/COMPLETE به created_by هم می‌تونی بزنی
        # فعلاً فقط اگر assignee فعلی عوض نشده، نوتیف نمی‌زنیم.

    # ─────────────────────────────────────────────
    # 🔊 Broadcast
    # ─────────────────────────────────────────────

    async def broadcast_message(self, event):
        await self.send_json(event["payload"])

    # ─────────────────────────────────────────────
    # 🧠 Helpers: payload
    # ─────────────────────────────────────────────

    def _message_payload(self, message_dict: dict, local_id=None):
        payload = {
            "type": "new_message",
            "id": message_dict["id"],
            "chat_id": int(self.chat_id),
            "sender_id": message_dict["sender_id"],
            "sender_name": message_dict["sender_name"],
            "message_type": message_dict["message_type"],
            "text": message_dict["text"],
            "created_at": message_dict["created_at"],
        }
        if message_dict.get("task_event"):
            payload["task_event"] = message_dict["task_event"]
        if local_id:
            payload["local_id"] = local_id
        return payload

    async def send_error(self, code: str, message: str):
        await self.send_json({"type": "error", "code": code, "message": message})

    async def notify_user_inbox(self, user_id: int, payload: dict):
        """
        نیازمند InboxConsumer نیست؛ فقط group_send به user_<id>.
        (اگر کلاینت به ws/inbox وصل باشد دریافت می‌کند)
        """
        await self.channel_layer.group_send(
            f"user_{user_id}",
            {"type": "broadcast_inbox", "payload": payload}
        )



    @database_sync_to_async
    def _chat_member_user_ids(self, chat_id: int):
        ChatMember = apps.get_model("base", "ChatMember")
        return list(
            ChatMember.objects.filter(chat_id=chat_id)
            .values_list("user_id", flat=True)
        )

    async def notify_user_inbox_to_chat_members(self, message_payload: dict):
        """
        هدف:
        - وقتی در یک چت پیام جدید ثبت شد، به تمام اعضای آن چت (به جز sender)
          روی کانال inbox (گروه user_<id>) یک event ارسال کنیم.
        - InboxConsumer آن را می‌گیرد و Flutter می‌تواند:
            - badge/unread را زیاد کند
            - لیست چت‌ها را آپدیت کند
            - notification نمایش دهد
        """

        sender_id = message_payload.get("sender_id")
        chat_id = int(message_payload.get("chat_id") or self.chat_id)

        user_ids = await self._chat_member_user_ids(chat_id)
        user_ids = [uid for uid in user_ids if uid and uid != sender_id]

        inbox_payload = {
            "type": "inbox_new_message",
            "chat_id": chat_id,
            "message_id": message_payload.get("id"),
            "sender_id": sender_id,
            "sender_name": message_payload.get("sender_name"),
            "message_type": message_payload.get("message_type"),
            "text_preview": (message_payload.get("text") or "")[:120],
            "created_at": message_payload.get("created_at"),
        }

        for uid in user_ids:
            await self.notify_user_inbox(uid, inbox_payload)
   

    # ─────────────────────────────────────────────
    # 🧠 Helpers (DB)
    # ─────────────────────────────────────────────

    @database_sync_to_async
    def is_chat_member(self, chat_id, user_id) -> bool:
        ChatMember = apps.get_model("base", "ChatMember")
        return ChatMember.objects.filter(chat_id=chat_id, user_id=user_id).exists()

    @database_sync_to_async
    def create_message(self, chat_id, sender_id, message_type, text, content_obj=None):
        Message = apps.get_model("base", "Message")
        User = apps.get_model("auth", "User")
        ContentType = apps.get_model("contenttypes", "ContentType")

        sender = User.objects.get(id=sender_id)

        msg = Message.objects.create(
            chat_id=chat_id,
            sender=sender,
            message_type=message_type,
            text=text,
            created_at=timezone.now(),
        )

        if content_obj is not None:
            msg.content_type = ContentType.objects.get_for_model(content_obj.__class__)
            msg.object_id = content_obj.id
            msg.save(update_fields=["content_type", "object_id"])

        return {
            "id": msg.id,
            "sender_id": sender.id,
            "sender_name": sender.get_full_name() or sender.username,
            "message_type": msg.message_type,
            "text": msg.text,
            "created_at": msg.created_at.isoformat(),
        }

    # ─────────────────────────────────────────────
    # ✅ DB: Task create / forward / action
    # ─────────────────────────────────────────────

    @database_sync_to_async
    def db_task_create(self, actor_id, chat_id, title, task_type, assignee_id, project_id, note):
        """
        قاعده:
        - اگر project_id داده شد: باید chat فعلی GROUP همان پروژه باشد
        - اگر project_id نبود: chat فعلی باید TASK باشد (پرونده)
        """
        Chat = apps.get_model("base", "Chat")
        Task = apps.get_model("base", "Task")
        TaskStep = apps.get_model("base", "TaskStep")
        TaskActionLog = apps.get_model("base", "TaskActionLog")
        User = apps.get_model("auth", "User")
        Project = apps.get_model("base", "Project")

        try:
            actor = User.objects.get(id=actor_id)
            assignee = User.objects.get(id=assignee_id)
        except User.DoesNotExist:
            return {"ok": False, "code": "not_found", "message": "کاربر یافت نشد."}

        try:
            chat = Chat.objects.get(id=chat_id)
        except Chat.DoesNotExist:
            return {"ok": False, "code": "not_found", "message": "چت یافت نشد."}

        # validate chat vs project
        project = None
        if project_id:
            try:
                project = Project.objects.get(id=project_id)
            except Project.DoesNotExist:
                return {"ok": False, "code": "not_found", "message": "پروژه یافت نشد."}

            if not (chat.chat_type == "GROUP" and chat.project_id == project.id):
                return {"ok": False, "code": "invalid_context", "message": "این عملیات باید داخل چت گروهی همان پروژه انجام شود."}
        else:
            if chat.chat_type != "TASK":
                return {"ok": False, "code": "invalid_context", "message": "ماموریت غیرپروژه‌ای باید داخل چت پرونده (TASK) ساخته شود."}

        with transaction.atomic():
            task = Task.objects.create(
                created_by=actor,
                project=project,
                chat=chat if project is None else None,
                title=title,
                task_type=task_type,
                assignee=assignee,
                status="PENDING",
                note=note,
            )

            step = TaskStep.objects.create(
                task=task,
                from_user=actor,
                to_user=assignee,
                state="PENDING",
                note=note,
                step_index=1,
            )

            TaskActionLog.objects.create(
                task=task,
                step=step,
                actor=actor,
                action="CREATE",
                prev_status=None,
                new_status="PENDING",
                prev_assignee_id=None,
                new_assignee_id=assignee.id,
                note=note,
                payload={"project_id": project.id if project else None},
            )

        # create TASK message (in the same chat you are connected to)
        msg = self._create_task_message(actor, chat_id, task, action="CREATE", step=step, note=note)

        return {
            "ok": True,
            "task_id": task.id,
            "task_status": task.status,
            "assignee_id": assignee.id,
            "message": msg,
        }

    @database_sync_to_async
    def db_task_forward(self, actor_id, chat_id, task_id, to_user_id, note):
        Chat = apps.get_model("base", "Chat")
        Task = apps.get_model("base", "Task")
        TaskStep = apps.get_model("base", "TaskStep")
        TaskActionLog = apps.get_model("base", "TaskActionLog")
        User = apps.get_model("auth", "User")

        try:
            actor = User.objects.get(id=actor_id)
            to_user = User.objects.get(id=to_user_id)
        except User.DoesNotExist:
            return {"ok": False, "code": "not_found", "message": "کاربر یافت نشد."}

        try:
            chat = Chat.objects.get(id=chat_id)
        except Chat.DoesNotExist:
            return {"ok": False, "code": "not_found", "message": "چت یافت نشد."}

        try:
            task = Task.objects.select_for_update().get(id=task_id)
        except Task.DoesNotExist:
            return {"ok": False, "code": "not_found", "message": "ماموریت یافت نشد."}

        # validate task context with this chat
        if task.project_id:
            if not (chat.chat_type == "GROUP" and chat.project_id == task.project_id):
                return {"ok": False, "code": "invalid_context", "message": "این ماموریت مربوط به این چت پروژه نیست."}
        else:
            if not (chat.chat_type == "TASK" and task.chat_id == chat.id):
                return {"ok": False, "code": "invalid_context", "message": "این ماموریت مربوط به این پرونده نیست."}

        # must be current assignee
        pending_step = TaskStep.objects.filter(task=task, state="PENDING").order_by("-step_index").first()
        if not pending_step:
            return {"ok": False, "code": "invalid_state", "message": "مرحله در انتظار یافت نشد."}

        if pending_step.to_user_id != actor.id:
            return {"ok": False, "code": "forbidden", "message": "فقط گیرنده مرحله جاری اجازه ارجاع دارد."}

        # hierarchy rule (hook)
        if not self.is_allowed_forward(actor, to_user):
            return {"ok": False, "code": "forbidden", "message": "ارجاع به این شخص طبق سلسله‌مراتب مجاز نیست."}

        with transaction.atomic():
            # close current step
            pending_step.state = "FORWARDED"
            pending_step.acted_at = timezone.now()
            if note:
                pending_step.note = (pending_step.note or "") + f"\n[FORWARD] {note}"
            pending_step.save(update_fields=["state", "acted_at", "note"])

            prev_assignee_id = task.assignee_id
            prev_status = task.status

            # create new step
            new_index = pending_step.step_index + 1
            new_step = TaskStep.objects.create(
                task=task,
                from_user=actor,
                to_user=to_user,
                state="PENDING",
                note=note,
                step_index=new_index,
            )

            # update task
            task.assignee = to_user
            task.status = "IN_PROGRESS" if task.status in ("PENDING", "IN_PROGRESS") else task.status
            task.save(update_fields=["assignee", "status", "updated_at"])

            TaskActionLog.objects.create(
                task=task,
                step=new_step,
                actor=actor,
                action="FORWARD",
                prev_status=prev_status,
                new_status=task.status,
                prev_assignee_id=prev_assignee_id,
                new_assignee_id=to_user.id,
                note=note,
                payload={"to_user_id": to_user.id, "from_step_id": pending_step.id},
            )

        msg = self._create_task_message(actor, chat_id, task, action="FORWARD", step=new_step, note=note)

        return {
            "ok": True,
            "task_id": task.id,
            "task_status": task.status,
            "new_assignee_id": to_user.id,
            "message": msg,
        }

    @database_sync_to_async
    def db_task_action(self, actor_id, chat_id, task_id, action, note):
        Chat = apps.get_model("base", "Chat")
        Task = apps.get_model("base", "Task")
        TaskStep = apps.get_model("base", "TaskStep")
        TaskActionLog = apps.get_model("base", "TaskActionLog")
        User = apps.get_model("auth", "User")

        try:
            actor = User.objects.get(id=actor_id)
        except User.DoesNotExist:
            return {"ok": False, "code": "not_found", "message": "کاربر یافت نشد."}

        try:
            chat = Chat.objects.get(id=chat_id)
        except Chat.DoesNotExist:
            return {"ok": False, "code": "not_found", "message": "چت یافت نشد."}

        try:
            task = Task.objects.select_for_update().get(id=task_id)
        except Task.DoesNotExist:
            return {"ok": False, "code": "not_found", "message": "ماموریت یافت نشد."}

        # validate context
        if task.project_id:
            if not (chat.chat_type == "GROUP" and chat.project_id == task.project_id):
                return {"ok": False, "code": "invalid_context", "message": "این ماموریت مربوط به این چت پروژه نیست."}
        else:
            if not (chat.chat_type == "TASK" and task.chat_id == chat.id):
                return {"ok": False, "code": "invalid_context", "message": "این ماموریت مربوط به این پرونده نیست."}

        pending_step = TaskStep.objects.filter(task=task, state="PENDING").order_by("-step_index").first()
        if not pending_step:
            return {"ok": False, "code": "invalid_state", "message": "مرحله در انتظار یافت نشد."}

        # COMMENT اجازه می‌دهیم حتی اگر گیرنده نباشد؟ تصمیم محصولی است.
        # چون گفتی خیلی اداری و خطی، فعلاً COMMENT را هم فقط گیرنده مرحله جاری مجاز می‌دانیم.
        if pending_step.to_user_id != actor.id:
            return {"ok": False, "code": "forbidden", "message": "فقط گیرنده مرحله جاری اجازه این اقدام را دارد."}

        prev_status = task.status
        prev_assignee_id = task.assignee_id

        with transaction.atomic():
            if action == "APPROVE":
                pending_step.state = "APPROVED"
                pending_step.acted_at = timezone.now()
                if note:
                    pending_step.note = (pending_step.note or "") + f"\n[APPROVE] {note}"
                pending_step.save(update_fields=["state", "acted_at", "note"])
                # در سیستم خطی، APPROVE به تنهایی کار را تمام نمی‌کند مگر تصمیم بگیری
                # فعلاً فقط وضعیت را IN_PROGRESS نگه می‌داریم
                task.status = "IN_PROGRESS"
                task.save(update_fields=["status", "updated_at"])

            elif action == "REJECT":
                pending_step.state = "REJECTED"
                pending_step.acted_at = timezone.now()
                if note:
                    pending_step.note = (pending_step.note or "") + f"\n[REJECT] {note}"
                pending_step.save(update_fields=["state", "acted_at", "note"])
                task.status = "REJECTED"
                task.save(update_fields=["status", "updated_at"])

            elif action == "COMPLETE":
                pending_step.state = "COMPLETED"
                pending_step.acted_at = timezone.now()
                if note:
                    pending_step.note = (pending_step.note or "") + f"\n[COMPLETE] {note}"
                pending_step.save(update_fields=["state", "acted_at", "note"])
                task.status = "DONE"
                task.save(update_fields=["status", "updated_at"])

            elif action == "COMMENT":
                # COMMENT گردش را تغییر نمی‌دهد
                if note:
                    pending_step.note = (pending_step.note or "") + f"\n[COMMENT] {note}"
                    pending_step.save(update_fields=["note"])

            else:
                return {"ok": False, "code": "invalid_action", "message": "action نامعتبر است."}

            TaskActionLog.objects.create(
                task=task,
                step=pending_step,
                actor=actor,
                action=action,
                prev_status=prev_status,
                new_status=task.status,
                prev_assignee_id=prev_assignee_id,
                new_assignee_id=task.assignee_id,
                note=note,
                payload={"step_id": pending_step.id},
            )

        msg = self._create_task_message(actor, chat_id, task, action=action, step=pending_step, note=note)
        return {"ok": True, "message": msg}
    # ─────────────────────────────────────────────
    # 🔐 Hierarchy permission
    # ─────────────────────────────────────────────

    def is_allowed_forward(self, actor_user, to_user) -> bool:
        """
        قانون ارجاع:
        - actor فقط می‌تواند به هم‌ردیف‌ها (siblings) یا زیردست‌ها (descendants) ارجاع بدهد.
        - هم‌سمت (same position) هم به عنوان هم‌سطح مجاز حساب می‌شود.
        - اگر position یکی از طرفین مشخص نباشد => ارجاع غیرمجاز.
        """

        # ارجاع به خود => غیرمجاز
        if actor_user.id == to_user.id:
            return False

        Employee = apps.get_model("base", "Employee")

        try:
            actor_emp = Employee.objects.select_related("position").get(user_id=actor_user.id)
            to_emp = Employee.objects.select_related("position").get(user_id=to_user.id)
        except Employee.DoesNotExist:
            return False

        actor_pos = actor_emp.position
        to_pos = to_emp.position

        if not actor_pos or not to_pos:
            return False

        # ✅ هم‌سمت
        if to_pos.id == actor_pos.id:
            return True

        # ✅ هم‌ردیف‌ها: parent_position مشترک
        if to_pos.parent_position_id == actor_pos.parent_position_id:
            return True

        # ✅ زیردست‌ها
        descendant_ids = self._get_descendant_position_ids(actor_pos.id)
        return to_pos.id in descendant_ids

    def _get_descendant_position_ids(self, root_position_id: int):
        """
        پیدا کردن همه descendant های یک Position بدون MPTT.
        BFS روی parent_position.
        """
        Position = apps.get_model("base", "Position")

        descendants = set()
        frontier = [root_position_id]

        while frontier:
            children = list(
                Position.objects.filter(parent_position_id__in=frontier)
                .values_list("id", flat=True)
            )
            frontier = []
            for cid in children:
                if cid not in descendants:
                    descendants.add(cid)
                    frontier.append(cid)

        return descendants

    # ─────────────────────────────────────────────
    # 🧾 Create TASK Message helper
    # ─────────────────────────────────────────────

    def _create_task_message(self, actor, chat_id, task, action, step, note):
        """
        یک Message با message_type=TASK می‌سازد و content_object را روی Task می‌گذارد.
        خروجی dict مناسب WS برمی‌گرداند.
        """
        Message = apps.get_model("base", "Message")
        ContentType = apps.get_model("contenttypes", "ContentType")

        msg = Message.objects.create(
            chat_id=chat_id,
            sender=actor,
            message_type="TASK",
            text="",  # متن اختیاری؛ UI از task_event استفاده می‌کند
            created_at=timezone.now(),
        )
        msg.content_type = ContentType.objects.get_for_model(task.__class__)
        msg.object_id = task.id
        msg.save(update_fields=["content_type", "object_id"])

        return {
            "id": msg.id,
            "sender_id": actor.id,
            "sender_name": actor.get_full_name() or actor.username,
            "message_type": "TASK",
            "text": "",
            "created_at": msg.created_at.isoformat(),
            "task_event": {
                "action": action,
                "task_id": task.id,
                "status": task.status,
                "assignee_id": task.assignee_id,
                "step_index": step.step_index if step else None,
                "actor_id": actor.id,
                "note": note or "",
            }
        }

    async def send_json(self, data: dict):
        await self.send(text_data=json.dumps(data))
