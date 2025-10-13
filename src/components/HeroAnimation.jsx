import React from 'react';
import { useRive, Layout, Fit, Alignment } from '@rive-app/react-canvas';
import riveAnimationFile from '../assets/ariobonyantoos.riv';

const HeroAnimation = () => {
  const { RiveComponent } = useRive({
    src: riveAnimationFile,
    stateMachines: 'scene',
    layout: new Layout({
      fit: Fit.Fill,       // ✅ پر کردن کامل با حفظ تناسب
      alignment: Alignment.Center,
    }),
    autoplay: true,
  });

  return (
    <div className="relative w-[95%] max-w-6xl mx-auto my-6 rounded-3xl border-4 border-gray-700 overflow-hidden shadow-2xl">
      <RiveComponent className="w-full h-[60vh] object-cover" />
    </div>
  );
};

export default HeroAnimation;
