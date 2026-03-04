# backend/base/views/task_views.py

import mimetypes
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db import transaction
from django.db.models import Max
from django.utils import timezone
from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from base.models import (
    Task, TaskStep, TaskActionLog,
    Employee, Position, Profile,
    Chat, ChatMember, Message,
    MediaFile,
)
from base.utilserializers.task_serializers import (
    TaskSerializer, TaskStepSerializer, TaskActionLogSerializer
)
from base.serializers import MediaFileSerializer
from base.utils.sms import send_sms
from base.utils.notify import _notify


# ─────────────────────────────────────────────
# SMS safe — فقط ساعت ۸ تا ۲۱ میفرسته
# ─────────────────────────────────────────────

def _send_sms_safe(phone: str, text: str):
    hour = timezone.localtime().hour
    if 8 <= hour < 21:
        send_sms(phone, text)


# ─────────────────────────────────────────────
# WS online notify
# ─────────────────────────────────────────────

def _send_inbox_event(user_id: int, payload: dict):
    try:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{user_id}",
            {"type": "broadcast_inbox", "payload": payload}
        )
    except Exception:
        pass


def _notify_task(
    *,
    to_user,
    event: str,
    task: Task,
    notif_type: str,
    title: str,
    body: str = '',
):
    _notify(
        user=to_user,
        notif_type=notif_type,
        title=title,
        body=body,
        obj=task,
    )
    _send_inbox_event(to_user.id, {
        "type":    "task_inbox",
        "event":   event,
        "task_id": task.id,
        "status":  task.status,
        "chat_id": task.chat_id,
        "title":   title,
        "body":    body,
    })


# ─────────────────────────────────────────────
# helpers
# ─────────────────────────────────────────────

def _get_descendant_position_ids(root_position_id: int) -> set:
    descendants = set()
    frontier = [root_position_id]
    while frontier:
        children = list(
            Position.objects.filter(
                parent_position_id__in=frontier,
                is_active=True,
            ).values_list('id', flat=True)
        )
        frontier = []
        for cid in children:
            if cid not in descendants:
                descendants.add(cid)
                frontier.append(cid)
    return descendants


def _check_and_close_task(task: Task):
    has_pending = task.steps.filter(state='PENDING').exists()
    if not has_pending:
        task.status = 'DONE'
        task.save(update_fields=['status', 'updated_at'])


def _detect_file_type(file) -> str:
    mime = mimetypes.guess_type(file.name)[0] or ''
    if mime.startswith('image'): return 'IMAGE'
    if mime.startswith('audio'): return 'AUDIO'
    if mime.startswith('video'): return 'VIDEO'
    return 'FILE'


# ─────────────────────────────────────────────
# GET /api/tasks/inbox/
# ─────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_task_inbox(request):
    user = request.user
    qs = (
        Task.objects
        .filter(steps__to_user=user, steps__state='PENDING')
        .exclude(status__in=['DONE', 'CANCELLED'])
        .distinct()
        .order_by('-updated_at')
    )
    return Response(TaskSerializer(qs, many=True).data)


# ─────────────────────────────────────────────
# GET /api/tasks/sent/
# ─────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_sent_tasks(request):
    user = request.user
    qs = (
        Task.objects
        .filter(created_by=user)
        .distinct()
        .order_by('-created_at')
    )
    return Response(TaskSerializer(qs, many=True).data)


# ─────────────────────────────────────────────
# GET /api/tasks/all/
# ─────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def all_tasks_admin(request):
    user = request.user
    if not (user.is_staff or user.is_superuser):
        return Response({"detail": "دسترسی ندارید."}, status=403)

    qs = Task.objects.all().order_by('-created_at')

    status_filter  = request.query_params.get('status')
    project_filter = request.query_params.get('project_id')

    if status_filter:
        qs = qs.filter(status=status_filter)
    if project_filter:
        qs = qs.filter(project_id=int(project_filter))

    return Response(TaskSerializer(qs, many=True).data)


# ─────────────────────────────────────────────
# GET /api/tasks/<task_id>/
# ─────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def task_detail(request, task_id: int):
    user = request.user
    try:
        task = Task.objects.get(id=task_id)
    except Task.DoesNotExist:
        return Response({"detail": "ماموریت یافت نشد."}, status=404)

    allowed = (
        task.created_by_id == user.id
        or TaskStep.objects.filter(task=task, to_user_id=user.id).exists()
        or TaskStep.objects.filter(task=task, from_user_id=user.id).exists()
    )
    if not allowed:
        return Response({"detail": "اجازه دسترسی ندارید."}, status=403)

    steps   = TaskStep.objects.filter(task=task).order_by('step_index', 'created_at')
    logs    = TaskActionLog.objects.filter(task=task).order_by('-created_at')
    task_ct = ContentType.objects.get_for_model(Task)
    files   = MediaFile.objects.filter(
        content_type=task_ct, object_id=task.id
    ).order_by('-uploaded_at')

    return Response({
        "task":  TaskSerializer(task, context={'request': request}).data,
        "steps": TaskStepSerializer(steps, many=True).data,
        "logs":  TaskActionLogSerializer(logs, many=True).data,
        "files": MediaFileSerializer(files, many=True, context={'request': request}).data,
    })


# ─────────────────────────────────────────────
# GET /api/tasks/subordinates/
# ─────────────────────────────────────────────
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_subordinates(request):
    user = request.user
    try:
        employee = Employee.objects.select_related('position').get(user=user)
    except Employee.DoesNotExist:
        return Response([])

    actor_position = employee.position
    if not actor_position:
        return Response([])

    # IDs زیر دست‌ها
    descendant_position_ids = _get_descendant_position_ids(actor_position.id)

    # یه کوئری واحد با Q — هم هم‌سطح‌ها هم زیر دست‌ها
    from django.db.models import Q

    employees = (
        Employee.objects
        .filter(
            Q(position__hierarchy_level=actor_position.hierarchy_level) |
            Q(position_id__in=descendant_position_ids)
        )
        .exclude(user=user)
        .filter(user__isnull=False)
        .select_related('user', 'position', 'user__profile')
        .order_by('position__hierarchy_level', 'name')
    )

    def get_avatar_url(emp):
        try:
            img = emp.user.profile.image
            if img:
                return request.build_absolute_uri(img.url)
        except Exception:
            pass
        return None

    return Response([
        {
            'user_id':         emp.user.id,
            'name':            emp.name,
            'username':        emp.user.username,
            'position_title':  emp.position.title if emp.position else '',
            'hierarchy_level': emp.position.hierarchy_level if emp.position else None,
            'avatar_url':      get_avatar_url(emp),
        }
        for emp in employees
    ])

# ─────────────────────────────────────────────
# POST /api/tasks/create/
# ─────────────────────────────────────────────

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_task(request):
    user = request.user
    data = request.data

    title     = (data.get('title') or '').strip()
    task_type = data.get('task_type', '').strip()

    assignee_ids = (
        request.data.getlist('assignee_ids')
        if hasattr(request.data, 'getlist')
        else request.data.get('assignee_ids', [])
    )
    if isinstance(assignee_ids, str):
        assignee_ids = [assignee_ids]

    note      = (data.get('note') or '').strip()
    raw_sms   = data.get('send_sms', False)
    send_sms_flag = raw_sms in (True, 'true', '1', 'True')
    project_id = data.get('project_id')

    if not title:
        return Response({'detail': 'عنوان ماموریت الزامی است.'}, status=400)

    valid_types = [t[0] for t in Task.TASK_TYPE_CHOICES]
    if task_type not in valid_types:
        return Response(
            {'detail': f'نوع ماموریت نامعتبر است. مقادیر مجاز: {valid_types}'},
            status=400,
        )

    if not assignee_ids or not isinstance(assignee_ids, list):
        return Response(
            {'detail': 'حداقل یک مسئول (assignee_ids) باید انتخاب شود.'},
            status=400,
        )

    assignee_ids = list(set([int(i) for i in assignee_ids if int(i) != user.id]))
    if not assignee_ids:
        return Response(
            {'detail': 'نمی‌توانید خودتان را به عنوان مسئول انتخاب کنید.'},
            status=400,
        )

    assignees = list(User.objects.filter(id__in=assignee_ids))
    if len(assignees) != len(assignee_ids):
        return Response({'detail': 'برخی کاربران یافت نشدند.'}, status=400)

    project = None
    if project_id:
        from base.models import Project
        try:
            project = Project.objects.get(id=int(project_id))
        except Project.DoesNotExist:
            return Response({'detail': 'پروژه یافت نشد.'}, status=404)

    # ── فقط DB داخل atomic ──
    with transaction.atomic():
        chat = Chat.objects.create(chat_type='TASK')

        all_user_ids = set([user.id] + [a.id for a in assignees])
        ChatMember.objects.bulk_create(
            [ChatMember(chat=chat, user_id=uid) for uid in all_user_ids],
            ignore_conflicts=True,
        )

        task = Task.objects.create(
            created_by=user,
            project=project,
            chat=chat,
            title=title,
            task_type=task_type,
            assignee=user,
            status='PENDING',
            note=note,
        )

        for idx, assignee in enumerate(assignees, start=1):
            step = TaskStep.objects.create(
                task=task,
                from_user=user,
                to_user=assignee,
                state='PENDING',
                note=note,
                step_index=idx,
                parent_step=None,
            )
            TaskActionLog.objects.create(
                task=task,
                step=step,
                actor=user,
                action='CREATE',
                prev_status=None,
                new_status='PENDING',
                prev_assignee_id=None,
                new_assignee_id=assignee.id,
                note=note,
                payload={'project_id': project.id if project else None},
            )

        msg = Message.objects.create(
            chat=chat,
            sender=user,
            message_type='TASK',
            text='',
        )
        msg.content_type = ContentType.objects.get_for_model(Task)
        msg.object_id    = task.id
        msg.save(update_fields=['content_type', 'object_id'])

        task.sms_sent = send_sms_flag
        task.save(update_fields=['sms_sent'])

        task_ct = ContentType.objects.get_for_model(Task)
        for f in request.FILES.getlist('files'):
            if f.size <= 20 * 1024 * 1024:
                MediaFile.objects.create(
                    file=f,
                    file_type=_detect_file_type(f),
                    uploaded_by=user,
                    content_type=task_ct,
                    object_id=task.id,
                )

    # ── SMS و notify بیرون از atomic ──
    if send_sms_flag:
        creator_name = (user.get_full_name() or '').strip() or user.username
        for assignee in assignees:
            try:
                profile = Profile.objects.get(user=assignee)
                if profile.phone_number:
                    assignee_name = (assignee.get_full_name() or '').strip() or assignee.username
                    _send_sms_safe(
                        profile.phone_number,
                        f"{assignee_name} عزیز،\n"
                        f"ماموریت جدید: {title}\n"
                        f"از طرف: {creator_name}\n"
                        f"سامانه آریو بنیان توس",
                    )
            except Profile.DoesNotExist:
                pass

    creator_display = user.get_full_name() or user.username
    for assignee in assignees:
        _notify_task(
            to_user=assignee,
            event='ASSIGNED',
            task=task,
            notif_type='TASK_ASSIGNED',
            title=f'ماموریت جدید: {task.title}',
            body=f'از طرف {creator_display}',
        )

    return Response(TaskSerializer(task).data, status=201)


# ─────────────────────────────────────────────
# POST /api/tasks/<task_id>/upload/
# ─────────────────────────────────────────────

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload_task_file(request, task_id: int):
    user = request.user
    try:
        task = Task.objects.get(id=task_id)
    except Task.DoesNotExist:
        return Response({"detail": "ماموریت یافت نشد."}, status=404)

    allowed = (
        task.created_by_id == user.id
        or TaskStep.objects.filter(task=task, to_user=user).exists()
    )
    if not allowed:
        return Response({"detail": "اجازه دسترسی ندارید."}, status=403)

    uploaded = request.FILES.get('file')
    if not uploaded:
        return Response({"detail": "فایلی ارسال نشده."}, status=400)

    if uploaded.size > 20 * 1024 * 1024:
        return Response({"detail": "حجم فایل نباید بیشتر از ۲۰ مگابایت باشد."}, status=400)

    task_ct = ContentType.objects.get_for_model(Task)
    media = MediaFile.objects.create(
        file=uploaded,
        file_type=_detect_file_type(uploaded),
        uploaded_by=user,
        content_type=task_ct,
        object_id=task.id,
    )

    return Response(
        MediaFileSerializer(media, context={'request': request}).data,
        status=201,
    )


# ─────────────────────────────────────────────
# POST /api/tasks/<task_id>/approve/
# ─────────────────────────────────────────────

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def approve_step(request, task_id: int):
    user = request.user
    note = (request.data.get('note') or '').strip()

    try:
        task = Task.objects.get(id=task_id)
    except Task.DoesNotExist:
        return Response({"detail": "ماموریت یافت نشد."}, status=404)

    step = TaskStep.objects.filter(
        task=task, to_user=user, state='PENDING'
    ).first()
    if not step:
        return Response({"detail": "step فعالی برای شما یافت نشد."}, status=400)

    # ── فقط DB داخل atomic ──
    with transaction.atomic():
        prev_status = task.status

        step.state    = 'APPROVED'
        step.acted_at = timezone.now()
        if note:
            step.note = note
        step.save(update_fields=['state', 'acted_at', 'note'])

        _check_and_close_task(task)
        task.refresh_from_db(fields=['status'])

        TaskActionLog.objects.create(
            task=task, step=step,
            actor=user, action='APPROVE',
            prev_status=prev_status,
            new_status=task.status,
            note=note,
            payload={},
        )

    # ── SMS و notify بیرون از atomic ──
    if task.status == 'DONE' and task.created_by:
        try:
            profile = Profile.objects.get(user=task.created_by)
            if profile.phone_number:
                _send_sms_safe(
                    profile.phone_number,
                    f"ماموریت «{task.title}» تکمیل شد.\n"
                    f"سامانه آریو بنیان توس",
                )
        except Profile.DoesNotExist:
            pass

        _notify_task(
            to_user=task.created_by,
            event='DONE',
            task=task,
            notif_type='TASK_DONE',
            title=f'ماموریت «{task.title}» تکمیل شد',
        )

    return Response({"detail": "تایید شد.", "task_status": task.status})


# ─────────────────────────────────────────────
# POST /api/tasks/<task_id>/reject/
# ─────────────────────────────────────────────

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reject_step(request, task_id: int):
    user = request.user
    note = (request.data.get('note') or '').strip()

    try:
        task = Task.objects.get(id=task_id)
    except Task.DoesNotExist:
        return Response({"detail": "ماموریت یافت نشد."}, status=404)

    step = TaskStep.objects.filter(
        task=task, to_user=user, state='PENDING'
    ).first()
    if not step:
        return Response({"detail": "step فعالی برای شما یافت نشد."}, status=400)

    # ── فقط DB داخل atomic ──
    with transaction.atomic():
        prev_status = task.status

        step.state    = 'REJECTED'
        step.acted_at = timezone.now()
        if note:
            step.note = note
        step.save(update_fields=['state', 'acted_at', 'note'])

        task.status = 'REJECTED'
        task.save(update_fields=['status', 'updated_at'])

        TaskActionLog.objects.create(
            task=task, step=step,
            actor=user, action='REJECT',
            prev_status=prev_status,
            new_status='REJECTED',
            note=note,
            payload={},
        )

    # ── SMS و notify بیرون از atomic ──
    if task.created_by:
        try:
            profile = Profile.objects.get(user=task.created_by)
            if profile.phone_number:
                actor_name = (user.get_full_name() or '').strip() or user.username
                _send_sms_safe(
                    profile.phone_number,
                    f"ماموریت «{task.title}» توسط {actor_name} رد شد.\n"
                    + (f"دلیل: {note}\n" if note else '')
                    + "سامانه آریو بنیان توس",
                )
        except Profile.DoesNotExist:
            pass

        _notify_task(
            to_user=task.created_by,
            event='REJECTED',
            task=task,
            notif_type='TASK_REJECTED',
            title=f'ماموریت «{task.title}» رد شد',
            body=note,
        )

    return Response({"detail": "رد شد.", "task_status": task.status})


# ─────────────────────────────────────────────
# POST /api/tasks/<task_id>/forward/
# ─────────────────────────────────────────────

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def forward_step(request, task_id: int):
    user       = request.user
    note       = (request.data.get('note') or '').strip()
    to_user_id = request.data.get('to_user_id')

    if not to_user_id:
        return Response({"detail": "to_user_id الزامی است."}, status=400)

    try:
        task = Task.objects.get(id=task_id)
    except Task.DoesNotExist:
        return Response({"detail": "ماموریت یافت نشد."}, status=404)

    try:
        to_user = User.objects.get(id=int(to_user_id))
    except User.DoesNotExist:
        return Response({"detail": "کاربر مقصد یافت نشد."}, status=404)

    if to_user.id == user.id:
        return Response({"detail": "نمی‌توانید به خودتان ارجاع دهید."}, status=400)

    step = TaskStep.objects.filter(
        task=task, to_user=user, state='PENDING'
    ).first()
    if not step:
        return Response({"detail": "step فعالی برای شما یافت نشد."}, status=400)

    # ── فقط DB داخل atomic ──
    with transaction.atomic():
        prev_status = task.status

        step.state    = 'FORWARDED'
        step.acted_at = timezone.now()
        if note:
            step.note = note
        step.save(update_fields=['state', 'acted_at', 'note'])

        max_index = task.steps.aggregate(m=Max('step_index'))['m'] or 0

        new_step = TaskStep.objects.create(
            task=task,
            from_user=user,
            to_user=to_user,
            state='PENDING',
            note=note,
            step_index=max_index + 1,
            parent_step=step,
        )

        task.status = 'IN_PROGRESS'
        task.save(update_fields=['status', 'updated_at'])

        TaskActionLog.objects.create(
            task=task, step=new_step,
            actor=user, action='FORWARD',
            prev_status=prev_status,
            new_status='IN_PROGRESS',
            prev_assignee_id=user.id,
            new_assignee_id=to_user.id,
            note=note,
            payload={'from_step_id': step.id},
        )

        if task.chat:
            ChatMember.objects.get_or_create(chat=task.chat, user=to_user)

    # ── SMS و notify بیرون از atomic ──
    try:
        profile = Profile.objects.get(user=to_user)
        if profile.phone_number:
            actor_name = (user.get_full_name() or '').strip() or user.username
            to_name    = (to_user.get_full_name() or '').strip() or to_user.username
            _send_sms_safe(
                profile.phone_number,
                f"{to_name} عزیز،\n"
                f"ماموریت «{task.title}» از طرف {actor_name} به شما ارجاع شد.\n"
                f"سامانه آریو بنیان توس",
            )
    except Profile.DoesNotExist:
        pass

    _notify_task(
        to_user=to_user,
        event='FORWARDED',
        task=task,
        notif_type='TASK_FORWARDED',
        title=f'ماموریت «{task.title}» به شما ارجاع شد',
        body=f'از طرف {user.get_full_name() or user.username}',
    )

    return Response({"detail": "ارجاع شد.", "task_status": task.status})
