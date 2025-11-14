import Bull, { Job, Queue } from "bull";
import nodemailer from "nodemailer";
import sgMail from "@sendgrid/mail";
import ejs from "ejs";
import path from "path";
import { EmailConfiguration } from "./email.interface";
import { logger } from "../../../../common/helper";
if (process.env.NODE_ENV === "production") sgMail.setApiKey(process.env.SEND_GRID_API_KEY);

// Configure the Redis connection
const emailQueue: Queue<EmailConfiguration> = new Bull("email-queue", {
  redis: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT), // Ensure port is a number
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  },
});

// Function to render the email template
const renderTemplate = async (template: string, data: any): Promise<string> => {
  const templatePath = path.join(__dirname, "..", "templates", `${template}.ejs`);

  return ejs.renderFile(templatePath, data);
};

// Process the email queue
emailQueue.process(async (job: Job<EmailConfiguration>) => {
  const { template, receiver, sender, subject, payload } = job.data;

  // Render HTML based on an EJS template
  const html = await renderTemplate(template, {
    subject,
    payload,
  });

  // Create a transport and send email
  if (process.env.NODE_ENV === "production") {
    await sgMail.send({
      from: {
        name: "Interface NRM",
        email: sender,
      },
      to: receiver,
      subject: subject,
      html: html,
      trackingSettings: {
        clickTracking: {
          enable: false,
          enableText: false,
        },
        openTracking: {
          enable: true,
        },
      },
      attachments: [],
    });
  } else {
    await nodemailer
      .createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        },
      })
      .sendMail({
        from: sender,
        to: receiver,
        subject: subject,
        html,
      });
  }
});

// Error handling
emailQueue.on("failed", (job: Job<EmailConfiguration>, err: Error) => {
  console.error(`Job failed: ${job.id}`, err);
});

emailQueue.on("completed", (job: Job<EmailConfiguration>) => {
  console.log(`Job completed: ${job.id}`);
});

export { emailQueue };
