/* ───────────────────────────────────────────────────────────────────────────
   The bits you'll want to change by hand. Everything else is generated.
   ───────────────────────────────────────────────────────────────────────── */

/* Which of Dad's solo shots go in the photobooth strips on the video-messages
   page. Five of them: the first three fill the left strip, the last two the
   right. Put the names in the order you want them to appear.

   Leave the list empty and it just takes the first five it finds.

   IMPORTANT: after renaming or adding anything in photos/photoboothPics/, run
   `npm run media`. The names below are matched against the generated list, so
   until that's re-run a new name matches nothing and you'll still see the old
   pictures. The dev console will warn you if a name doesn't match.

   Available (these are the files in photos/photoboothPics/, lower-cased with
   dots and spaces turned into dashes):

     20240703-183725          img-0835      img-8074
     20240709-090736          img-0843      img-8420
     20260830-154603          img-0976      img-8423
     20260831-131013          img-2461      img-8469
     20260903-103645          img-7506      img-8979
     75536c59-279b-4150-b71c-9b1fe667df08   img-7892      img-9016
     77f134b7-a105-4139-b2d0-9035f9ae3c76   img-9409      img-9511
     pxl-20221027-135119358-portrait        snapchat-4793198

   Add more pictures to photos/photoboothPics/ and run `npm run media` to see
   them in that list. */
export const photoboothPicks = [
  '01',
  '02',
  '03',
  '04',
  '05',
];

/* The banner at the top of each page. */
export const banners = {
  messages: {
    eyebrow: 'Fifty years of you',
    title: 'Happy 50th Birthday Achacha!!!',
    blurb: "Everyone recorded you something. Press play on the first one and the rest will follow on their own.",
  },
  cinema: { title: 'The Main Event' },
};

/* Signed off at the foot of the video messages page. */
export const loveNote = ['With lots of love', 'Jochi, Milu, Chakuuu'];
