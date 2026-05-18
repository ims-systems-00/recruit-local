import axios, { AxiosError } from "axios";
import * as cheerio from "cheerio";
import { BadRequestException } from "../../../common/helper";

const DEFAULT_IMAGE = "logo-placeholder.svg";
const REQUEST_TIMEOUT_MS = 5000;
const USER_AGENT = "Mozilla/5.0 (compatible; LinkPreviewBot/1.0)";

interface WebsiteMetadata {
  title: string;
  description: string;
  image: string;
  url: string;
  siteName: string;
}

const validateUrl = (url: string): string => {
  let validatedUrl = url.trim().replace(/\/$/, "");

  if (!/^https?:\/\//i.test(validatedUrl)) {
    validatedUrl = `https://${validatedUrl}`;
  }

  try {
    new URL(validatedUrl);
    return validatedUrl;
  } catch (error) {
    throw new BadRequestException("Invalid URL format.");
  }
};

const isFavicon = (url: string): boolean => url.includes("favicon") || url.endsWith(".ico");

const normalizeImageUrl = (baseUrl: string, imagePath?: string): string | null => {
  if (!imagePath) return null;

  try {
    if (isFavicon(imagePath)) {
      const base = new URL(baseUrl);
      if (imagePath.startsWith("/")) {
        return `${base.origin}${imagePath}`;
      }
      return `${base.origin}/favicon.ico`;
    }

    return new URL(imagePath, baseUrl).href;
  } catch {
    return null;
  }
};

const extractImageUrls = ($: cheerio.CheerioAPI, baseUrl: string): string[] => {
  const metaImages = [
    $('meta[property="og:image"]').attr("content"),
    $('meta[name="twitter:image"]').attr("content"),
    $('meta[name="twitter:image:src"]').attr("content"),
    $('meta[itemprop="image"]').attr("content"),
  ];

  const linkImages = [
    $('link[rel="image_src"]').attr("href"),
    $('link[rel="apple-touch-icon"]').attr("href"),
    $('link[rel="icon"]').attr("href"),
  ];

  const pageImages = $("img")
    .toArray()
    .map((el) => $(el).attr("src"))
    .filter((src) => src && !src.match(/(logo|icon)/i));

  return [...metaImages, ...linkImages, ...pageImages]
    .filter(Boolean)
    .map((url) => normalizeImageUrl(baseUrl, url as string))
    .filter(Boolean) as string[];
};

const findBestImage = (imageUrls: string[]): string => imageUrls[0] || DEFAULT_IMAGE;

const extractTitle = ($: cheerio.CheerioAPI, fallback: string): string =>
  $('meta[property="og:title"]').attr("content") ||
  $('meta[name="twitter:title"]').attr("content") ||
  $("title").text() ||
  fallback;

const extractDescription = ($: cheerio.CheerioAPI): string =>
  $('meta[property="og:description"]').attr("content") ||
  $('meta[name="twitter:description"]').attr("content") ||
  $('meta[name="description"]').attr("content") ||
  "";

const extractSiteName = ($: cheerio.CheerioAPI, url: string): string =>
  $('meta[property="og:site_name"]').attr("content") || new URL(url).hostname.replace("www.", "");

const extractMetadata = ($: cheerio.CheerioAPI, url: string): WebsiteMetadata => {
  const imageUrls = extractImageUrls($, url);

  return {
    title: extractTitle($, url),
    description: extractDescription($),
    image: findBestImage(imageUrls),
    url,
    siteName: extractSiteName($, url),
  };
};

const handleAxiosError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;

    if (axiosError.code === "ECONNABORTED") throw new BadRequestException("Request timed out while fetching URL.");
    if (axiosError.response)
      throw new BadRequestException(`The website returned an error (HTTP ${axiosError.response.status}).`);
    if (axiosError.request)
      throw new BadRequestException("Could not connect to the website. Please check the URL and try again.");
  }

  throw new BadRequestException("Failed to fetch metadata from the provided URL.");
};

export const getMetadata = async (url: string): Promise<WebsiteMetadata> => {
  try {
    const validatedUrl = validateUrl(url);
    const response = await axios.get(validatedUrl, {
      timeout: REQUEST_TIMEOUT_MS,
      headers: { "User-Agent": USER_AGENT },
    });

    const $ = cheerio.load(response.data);
    return extractMetadata($, validatedUrl);
  } catch (error) {
    handleAxiosError(error);
  }
};
