// // src/componenets/ui/Text.jsx
// import React from 'react'
// import { clsx } from 'clsx'

// // آبجکتی برای نگهداری کلاس‌های استایل
// const variants = {
//   size: {
//     xs: 'text-xs',
//     sm: 'text-sm',
//     base: 'text-base', // معادل md
//     lg: 'text-lg',
//     xl: 'text-xl',
//     '2xl': 'text-2xl',
//     '3xl': 'text-3xl',
//   },
//   weight: {
//     normal: 'font-normal',
//     medium: 'font-medium',
//     semibold: 'font-semibold',
//     bold: 'font-bold',
//   },
//   color: {
//     primary: 'text-gray-900 dark:text-gray-100', // متن اصلی
//     secondary: 'text-gray-600 dark:text-gray-400', // متن فرعی
//     danger: 'text-red-600 dark:text-red-400',
//     // ... بقیه رنگ‌ها
//   },
// }

// export default function Text({
//   as: Component = 'p', // تگ پیش‌فرض p است، اما می‌تواند span, h1, h2 و ... باشد
//   size = 'base',
//   weight = 'normal',
//   color = 'primary',
//   className,
//   children,
// }) {
//   const sizeClass = variants.size[size]
//   const weightClass = variants.weight[weight]
//   const colorClass = variants.color[color]

//   return (
//     <Component className={clsx(sizeClass, weightClass, colorClass, className)}>
//       {children}
//     </Component>
//   )
// }