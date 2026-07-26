// Button — variants: primary | secondary | ghost | danger
// sizes: sm | md | lg
export default function Button({
  variant = 'primary', size = 'md', loading = false,
  disabled = false, leftIcon, rightIcon, children, className = '', ...rest
}) {
  const base = 'inline-flex items-center justify-center gap-1.5 font-medium rounded-md transition-all duration-150 cursor-pointer border-0 whitespace-nowrap select-none';
  const sizes = { sm: 'text-xs px-3 py-1.5', md: 'text-[13px] px-3.5 py-2', lg: 'text-sm px-5 py-2.5' };
  const variants = {
    primary:   'btn-primary',
    secondary: 'btn-secondary',
    ghost:     'btn-ghost',
    danger:    'text-[13px] inline-flex items-center justify-center gap-1.5 font-medium rounded-md px-3.5 py-2 bg-transparent border border-transparent text-[color:var(--danger)] hover:bg-[rgba(239,68,68,0.08)] transition-all duration-150',
  };
  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${disabled || loading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
      ) : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
}
