import Link from 'next/link';
import React from 'react';
import Image from 'next/image';
import img1 from '@/public/images/team-1.svg';
import img2 from '@/public/images/team-2.svg';
import img3 from '@/public/images/team-3.svg';
import img4 from '@/public/images/team-4.svg';

export default function RecruitmentTeam() {
  const images = [
    {
      id: 1,
      src: img1,
      alt: 'HR team working at office',
      description:
        'More than a platform, RecruitLocal Premium works like an extension of your HR and recruitment team. You get direct access to professional HR advice, helping you make better hiring decisions with more confidence.',
    },
    {
      id: 2,
      src: img2,
      alt: 'Recruitment professionals collaborating',
      description:
        'More than a platform, RecruitLocal Premium works like an extension of your HR and recruitment team. You get direct access to professional HR advice, helping you make better hiring decisions with more confidence.',
    },
    {
      id: 3,
      src: img3,
      alt: 'Team meeting with laptop',
      description:
        'More than a platform, RecruitLocal Premium works like an extension of your HR and recruitment team. You get direct access to professional HR advice, helping you make better hiring decisions with more confidence.',
    },
    {
      id: 4,
      src: img4,
      alt: 'Business professionals in discussion',
      description:
        'More than a platform, RecruitLocal Premium works like an extension of your HR and recruitment team. You get direct access to professional HR advice, helping you make better hiring decisions with more confidence.',
    },
  ];
  return (
    <section className="bg-bg-brand-solid-alt">
      <div className="max-w-[1280px] mx-auto px-spacing-5xl py-spacing-10xl text-white flex flex-col gap-y-spacing-8xl">
        <div className=" flex flex-col items-center justify-center text-center gap-y-spacing-5xl">
          <p className=" text-heading-lg font-heading-lg-strong! max-w-[734px]">
            More than a platform your extended HR & recruitment team
          </p>
          <Link
            href="#"
            className="text-label-lg rounded-full font-label-lg-strong! flex items-center h-14 justify-center gap-spacing-xs py-spacing-xl px-spacing-3xl bg-bg-brand-solid-primary"
          >
            Explore Employer Premium
          </Link>
        </div>
        <div className="group flex gap-spacing-xl md:gap-spacing-5xl h-44 sm:h-52 md:h-64 lg:h-[352px]">
          {images.map((img) => (
            <div
              key={img.id}
              className="group/item relative overflow-hidden rounded-xl cursor-pointer flex-1 transition-all duration-1000 ease-in-out hover:flex-[2.5] "
            >
              <Image
                src={img.src}
                alt={img.alt}
                width={544}
                height={352}
                className="w-full h-full object-cover"
              />

              <div className=" absolute bottom-0 left-0 right-0 p-spacing-3xl md:p-spacing-5xl bg-linear-to-t from-black/95 via-black/50 to-transparent opacity-0 transition-opacity duration-1000 group-hover/item:opacity-100 ">
                <p className="text-white text-body-sm">{img.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
