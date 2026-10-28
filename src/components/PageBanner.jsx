/* The same sheet of letter paper at the top of every page, so the three
   screens read as pages of one thing. */
export default function PageBanner({ eyebrow, title, blurb, children, compact = false }) {
  return (
    <header className="relative">
      <div className="wrap-full h-4 w-full" />

      <div className="mx-auto max-w-[1500px] px-10 py-10">
        <div
          className="banner-paper rounded-[4px] px-12 py-10"
          style={{ transform: 'rotate(-0.5deg)' }}
        >
          <div className={`relative flex items-center justify-center gap-14 ${compact ? 'flex-col' : ''}`}>
            <div className={`min-w-0 ${compact ? 'text-center' : 'max-w-[560px]'}`}>
              {eyebrow && (
                <p className="script text-[25px] leading-none text-[#8a5a2b]">{eyebrow}</p>
              )}
              <h1
                className={`display mt-2 leading-[1.05] text-[#7a1225] ${
                  compact ? 'text-[clamp(44px,5.4vw,74px)]' : 'text-[clamp(48px,5.8vw,82px)]'
                }`}
              >
                {title}
              </h1>
              {blurb && (
                <p className="mt-5 text-[16px] leading-relaxed text-[#4a3524]">{blurb}</p>
              )}
            </div>
            {children}
          </div>
        </div>
      </div>

      <div className="wrap-full h-4 w-full" />
    </header>
  );
}
