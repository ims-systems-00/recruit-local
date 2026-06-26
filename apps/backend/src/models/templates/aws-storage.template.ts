// Define the interface for the AWS storage template
export interface AwsStorageTemplate {
  Name: string;
  key?: string;
  Key: string;
  Bucket: string;
}

// This denifition will be used in mongoose schema
export const awsStorageTemplateMongooseDefinition = {
  Name: String,
  key: String,
  Key: String,
  Bucket: String,
};
