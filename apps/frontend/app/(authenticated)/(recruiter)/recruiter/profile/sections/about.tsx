import { Building, Mailbox, Users } from 'lucide-react';
import React from 'react';

export default function About() {
  return (
    <div className=" space-y-spacing-4xl">
      <div className=" flex justify-between items-center">
        <h4 className=" text-text-gray-secondary text-heading-sm font-heading-sm-strong!">
          About
        </h4>
      </div>
      <div className=" space-y-spacing-2xl">
        <div className=" space-y-spacing-lg">
          <p className=" text-label-lg font-label-lg-strong! text-text-gray-secondary">
            Boot Tech
          </p>
          <p className=" text-body-lg text-text-gray-tertiary">
            Boot Tech is a forward-thinking technology company committed to
            building powerful digital solutions that drive progress and
            innovation. Founded with the vision to bridge ideas and execution,
            Boot Tech specializes in software development, user experience
            design, and enterprise-grade technology services. From startups to
            industry leaders, we help clients accelerate digital transformation
            through cutting-edge tools, smart automation, and scalable
            platforms. At Boot Tech, we believe in the power of simplicity,
            speed, and smart systems. Our team of engineers, designers, and
            strategists work at the intersection of creativity and technology to
            deliver impactful results that empower businesses and improve lives.
          </p>
          <div className=" grid grid-cols-2 gap-spacing-lg">
            {[1, 2].map((item) => (
              <div
                key={item}
                className=" rounded-2xl border border-border-gray-secondary p-spacing-4xl flex gap-spacing-lg items-center"
              >
                <div className=" w-12 h-12 rounded-xl flex items-center justify-center border border-others-gray-light bg-others-gray-gray-zero shadow-xs ">
                  <Users />
                </div>
                <div className=" space-y-spacing-3xs">
                  <p className=" text-label-lg font-label-lg-strong! text-text-gray-primary">
                    400
                  </p>
                  <p className=" text-label-sm text-text-gray-tertiary">
                    Employers
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className=" space-y-spacing-lg">
          <p className=" text-label-lg font-label-lg-strong! text-text-gray-secondary">
            Contact and Address
          </p>
          <div className=" grid grid-cols-2 gap-spacing-lg">
            {[1, 2].map((item) => (
              <div
                key={item}
                className=" rounded-2xl border border-border-gray-secondary p-spacing-4xl flex gap-spacing-lg items-center"
              >
                <div className=" w-12 h-12 rounded-xl flex items-center justify-center border border-others-gray-light bg-others-gray-gray-zero shadow-xs ">
                  <Mailbox />
                </div>
                <div className=" space-y-spacing-3xs">
                  <p className=" text-label-lg font-label-lg-strong! text-text-gray-primary">
                    Contact Email
                  </p>
                  <p className=" text-label-sm text-text-gray-tertiary">
                    Boottech@gmail.com
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className=" space-y-spacing-lg">
          <div className=" rounded-2xl border border-border-gray-secondary p-spacing-4xl flex flex-col gap-spacing-2xl">
            <div className="flex gap-spacing-lg items-center">
              <div className=" w-12 h-12 rounded-xl flex items-center justify-center border border-others-gray-light bg-others-gray-gray-zero shadow-xs ">
                <Building />
              </div>
              <div className=" space-y-spacing-3xs">
                <p className=" text-label-lg font-label-lg-strong! text-text-gray-primary">
                  Office Address
                </p>
                <p className=" text-label-sm text-text-gray-tertiary">
                  123 Innovation Drive, Tech City, CA 90210
                </p>
              </div>
            </div>
            <div>
              <p className=" text-label-md font-label-md-strong! text-text-gray-secondary">
                Map
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
