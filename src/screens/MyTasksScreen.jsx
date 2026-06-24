// ببین درست شد ؟import logging
// import requests
// from django.conf import settings

// logger = logging.getLogger(__name__)
// import threading

// def normalize_phone_for_meli(phone: str) -> str:
//     """نرمال‌سازی شماره موبایل برای ملی پیامک"""
//     p = phone.strip()
//     if p.startswith('+98'):   p = '0' + p[3:]
//     elif p.startswith('98'):  p = '0' + p[2:]
//     elif p.startswith('0098'): p = '0' + p[4:]
//     if not p.startswith('0'): p = '0' + p
//     return p


// def send_pattern_sms(body_id: int, to: str, args: list[str]) -> dict:
//     """
//     ارسال از خط خدماتی اشتراکی.
//     body_id: 422556 برای OTP، 423014 برای ماموریت
//     args: ["123456"] یا ["نام", "عنوان ماموریت"]
//     """
//     safe_phone = normalize_phone_for_meli(to)
//     url = f"https://console.melipayamak.com/api/send/shared/{settings.MELIPAYAMAK_SHARED_TOKEN}"

//     payload = {
//         "bodyId": body_id,
//         "to": safe_phone,
//         "args": args,
//     }

//     rec_id = None

//     try:
//         resp = requests.post(url, json=payload, timeout=10)
//         if resp.status_code == 200:
//             result = resp.json()
//             candidate = result.get("recId")
//             if isinstance(candidate, int) and candidate > 1_000_000:
//                 rec_id = candidate
//                 logger.info("✅ Pattern SMS موفق: to=%s recId=%s", safe_phone, rec_id)
//             else:
//                 logger.warning("⚠️ Pattern SMS خطا: to=%s result=%s", safe_phone, result)
//         else:
//             result = resp.text
//         return {"status_code": resp.status_code, "result": result, "rec_id": rec_id}
//     except Exception as e:
//         logger.error("❌ Pattern SMS شکست: %s", e)
//         return {"status_code": 500, "result": str(e), "rec_id": None}

        

// def send_otp_sms(phone: str, otp_code: str) -> dict:
//     """OTP – bodyId 422556"""
//     return send_pattern_sms(settings.MELIPAYAMAK_BODY_ID_OTP, phone, [otp_code])


// def send_task_assigned_sms(phone: str, employee_name: str, task_title: str) -> dict:
//     """ماموریت – bodyId 423014"""
//     return send_pattern_sms(settings.MELIPAYAMAK_BODY_ID_TASK, phone, [employee_name, task_title])






// def send_otp_sms_async(phone: str, otp_code: str):
//     """ارسال SMS در background thread"""
//     def _send():
//         result = send_otp_sms(phone, otp_code)
//         if result['status_code'] != 200:
//             logger.error("Background OTP SMS failed for %s: %s", phone, result)
//         else:
//             logger.info("Background OTP SMS sent to %s", phone)
    
//     thread = threading.Thread(target=_send, daemon=True)
//     thread.start()


// اینم از شماره ها
// MELIPAYAMAK_BODY_ID_OTP = 422556      # رمز موقت {0}
// MELIPAYAMAK_BODY_ID_TASK = 423014     # ماموریت {0} {1}
// MELIPAYAMAK_BODY_ID_TASK_REMINDER = 479903

// اینکه برات فروارد میشه جداست  من میخام یک سیستم برای یاداوری مامویت های انجام نشده توی یک بازه های زمانی ک از نظر روانشناسی هم کارگر و کارمند را ملزم به کار کند .
// اگ متن های خاصی هم مد نظر داری بگو و اینکه بیا حالا که یک مدلم اضافه کردیم پیش بریم از بیس 
// یک چیز کلی دیگ هم میخام 
// اول مدلای زیرمو نگاه کنی بهت توضیح بدم راحت بفهمی :

// class Position(models.Model):
//     """
//     سمت‌های سازمانی با رنگ‌بندی برای نقشه
//     """
//     title = models.CharField(max_length=200, verbose_name="عنوان سمت")
//     code = models.CharField(max_length=50, unique=True, verbose_name="کد سمت")
    
    

//     # جایگزین parent_position
//     parents = models.ManyToManyField(
//         'self',
//         symmetrical=False,
//         through='PositionRelation',            # یا 'base.PositionRelation' (پایین توضیح دادم)
//         through_fields=('child', 'parent'),
//         related_name='children',
//         blank=True,
//     )

//     hierarchy_level = models.IntegerField(default=3, verbose_name="سطح سلسله مراتب")
    
//     # نوع گزارش
//     REPORT_TYPE_CHOICES = [
//         ('PROJECT_MANAGER', 'مدیر پروژه'),
//         ('WORKSHOP_SUPERVISOR', 'سرپرست کارگاه'),
//         ('FOREMAN', 'سرکارگر'),
//         ('WORKER', 'کارگر'),
//         ('FACILITIES_STAFF', 'پرسنل تاسیسات'),
//         ('SECURITY_GUARD', 'نگهبان'),
//         # 👇 این‌ها را اضافه کن اگر نیستند
//         ('ACCOUNTANT', 'حسابدار'), 
//         ('TECHNICAL_OFFICE', 'دفتر فنی'),
//         ('HR_MANAGER', 'مدیر منابع انسانی'),
//         ('STORE_KEEPER', 'انباردار'),
//     ]
//     report_type = models.CharField(
//         max_length=30,
//         choices=REPORT_TYPE_CHOICES,
//         default='WORKER',
//         verbose_name="نوع گزارش"
//     )
    
//     # ✅ رنگ برای نقشه
//     color_hex = models.CharField(
//         max_length=7,
//         default='#3B82F6',  # آبی پیش‌فرض
//         verbose_name="رنگ (HEX)",
//         help_text="رنگ نمایش در نقشه (مثلا #FFA500)"
//     )
    
//     # دسترسی‌ها
//     can_enter_boq_items = models.BooleanField(
//         default=False,
//         verbose_name="دسترسی ثبت فهرست‌بها"
//     )
//     can_enter_store_items = models.BooleanField(
//         default=False,
//         verbose_name="دسترسی به انبار"
//     )
    
//     description = models.TextField(blank=True, verbose_name="توضیحات")
    
//     # متادیتا
//     created_at = models.DateTimeField(auto_now_add=True)
//     updated_at = models.DateTimeField(auto_now=True)
//     is_active = models.BooleanField(default=True, verbose_name="فعال")

//     class Meta:
//         verbose_name = "سمت سازمانی"
//         verbose_name_plural = "سمت‌های سازمانی"
//         ordering = ['hierarchy_level', 'title']

//     def __str__(self):
//         return f"{self.title} (سطح {self.hierarchy_level})"


