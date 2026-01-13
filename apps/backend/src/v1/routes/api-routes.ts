import express, { Express } from "express";
import authRoutes from "../modules/authentication/auth.route";
import tenantRoutes from "../modules/tenant/tenant.route";
// import commentActivityRoutes from "../modules/comment-activity/comment-activity.route";

// import fileMediaRoutes from "../modules/file-media/file-media.route";
// import fileStorageRoutes from "../modules/file-storage/file-storage.route";
// import notificationRoutes from "../modules/notification/notification.route";

import invitationRoutes from "../modules/invitation/invitation.route";
// import documentFolderRoutes from "../modules/document-folder/document-folder.route";
import userRoutes from "../modules/user/user.route";
// import taskRoutes from "../modules/task/task.route";

// import formBuilderRoutes from "../modules/forms/forms.routes";

import { deserializeUser } from "../../common/middlewares";
// import responseTemplateRoutes from "../modules/response-template/response-template.route";
import jobProfileRoutes from "../modules/job-profile/job-profile.route";
import educationRoutes from "../modules/education/education.route";
import experienceRoutes from "../modules/experience/experience.route";
import certificationRoutes from "../modules/certification/certification.route";
import interestRoutes from "../modules/interest/interest.route";
import skillRoutes from "../modules/skill/skill.route";
import jobRoute from "../modules/job/job.route";
import cvRoutes from "../modules/cv/cv.route";
import applicationRoutes from "../modules/application/application.route";
import eventRoutes from "../modules/event/event.route";
import eventRegistrationRoutes from "../modules/event-registration/event-registration.route";
import favouriteRoutes from "../modules/favourite/favourite.route";

const router = express.Router();

const getApiRoutes = () => {
  router.use("/auth", authRoutes);
  router.use(deserializeUser);
  router.use("/tenants", tenantRoutes);
  // router.use("/comment-activities", commentActivityRoutes);
  // router.use("/file-medias", fileMediaRoutes);
  // router.use("/file-storage", fileStorageRoutes);
  // router.use("/notifications", notificationRoutes);
  router.use("/invitations", invitationRoutes);
  // router.use("/document-folders", documentFolderRoutes);
  router.use("/users", userRoutes);
  // router.use("/tasks", taskRoutes);
  // router.use("/forms", formBuilderRoutes);
  // router.use("/response-templates", responseTemplateRoutes);
  router.use("/job-profiles", jobProfileRoutes);
  router.use("/educations", educationRoutes);
  router.use("/experiences", experienceRoutes);
  router.use("/certifications", certificationRoutes);
  router.use("/interests", interestRoutes);
  router.use("/skills", skillRoutes);
  router.use("/jobs", jobRoute);
  router.use("/cvs", cvRoutes);
  router.use("/applications", applicationRoutes);
  router.use("/events", eventRoutes);
  router.use("/event-registrations", eventRegistrationRoutes);
  router.use("/favourites", favouriteRoutes);

  return router;
};

export const setupApiRoutes = (app: Express): void => {
  app.use("/api/v1", getApiRoutes());
};
