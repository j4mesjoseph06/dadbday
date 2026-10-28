/* The same sheet of letter paper at the top of every page, so the three
   screens read as pages of one thing. */
export default function PageBanner({ eyebrow, title, blurb, children, compact = false }) {
  return (
    <header className="relative">
      <div className="wrap-full h-4 w-full" />

      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-10 sm:py-10">
        <div
          className="banner-paper rounded-[4px] px-6 py-8 sm:px-12 sm:py-10"
          style={{ transform: 'rotate(-0.5deg)' }}
        >
          <div className={`relative flex flex-col items-center justify-center gap-8 lg:flex-row lg:gap-14 ${compact ? 'lg:flex-col' : ''}`}>
            <div className={`min-w-0 text-center lg:text-left ${compact ? 'lg:text-center' : 'max-w-[560px]'}`}>
              {eyebrow && (
                <p className="script text-[20px] leading-none text-[#8a5a2b] sm:text-[25px]">{eyebrow}</p>
              )}
              <h1
                className={`display mt-2 leading-[1.05] text-[#7a1225] ${
                  compact ? 'text-[clamp(32px,7vw,74px)]' : 'text-[clamp(34px,7vw,82px)]'
                }`}
              >
                {title}
              </h1>
              {blurb && (
                <p className="mt-4 text-[15px] leading-relaxed text-[#4a3524] sm:mt-5 sm:text-[16px]">{blurb}</p>
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
