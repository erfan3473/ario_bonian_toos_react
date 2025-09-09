import React from "react";

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-gray-400 py-4">
      <div className="container mx-auto text-center">
        <p className="text-sm">
          © {new Date().getFullYear()} پنل مدیریت کارگران | طراحی شده با ❤️
        </p>
      </div>
    </footer>
  );
};

export default Footer;
