import React from 'react';

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyle = "px-4 py-2 rounded-btn font-medium transition-all duration-200 ease-in-out inline-flex items-center justify-center";
  
  const variants = {
    primary: "bg-primary text-white hover:bg-primary-light shadow-md hover:shadow-hover",
    secondary: "bg-primary-glow text-primary hover:bg-primary-light hover:text-white",
    outline: "border border-primary text-primary hover:bg-primary hover:text-white",
    ghost: "bg-transparent text-neutral-muted hover:text-primary hover:bg-background",
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
