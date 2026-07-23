import { Job } from "bullmq";
import nodemailer from "nodemailer";
import sgMail from "@sendgrid/mail";
import ejs from "ejs";
import path from "path";
import { EmailConfiguration } from "./email.interface";
import { ReusableQueue } from "../../../../queue/Queue";
if (process.env.NODE_ENV === "production") sgMail.setApiKey(process.env.SEND_GRID_API_KEY);

// Function to render the email template
const renderTemplate = async (template: string, data: any): Promise<string> => {
  const templatePath = path.join(__dirname, "..", "templates", `${template}.ejs`);

  return ejs.renderFile(templatePath, data);
};

// Process the email queue
const processEmail = async (job: Job<EmailConfiguration>) => {
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
};

const emailQueue = new ReusableQueue<EmailConfiguration>("email-queue", processEmail);

export { emailQueue };
