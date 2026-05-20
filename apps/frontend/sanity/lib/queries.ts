export const POSTS_QUERY = `*[_type == "post"] | order(_publishedAt desc) {
  _id,
  title,
  "slug": slug.current,
  "mainImage": mainImage.asset->url,
  publishedAt,
  body
}`;

export const PRODUCT_QUERY = `*[_type == "product" && slug.current == $slug][0]{

  name,
  title,
  signup,
  description,
  mainVideo,
  "thumbnail": mainThumbnail.asset->url,
  "logo": logo.asset->url,
  overview {
    title,
    description,
    whoIsFor,
    problemSolved
  },
  standards,
  features[] {
    title,
    description,
    "icon": icon.asset->url
  },
  body
}`;

export const PRODUCTS_LIST_QUERY = `*[_type == "product"] | order(order asc){
  name,
  title,
  description,
  order,
  "slug": slug.current,
  "thumbnail": mainThumbnail.asset->url,
  "logo": logo.asset->url
}`;

export const PRODUCTS_CARD_QUERY = `*[_type == "product" && slug.current != $slug][0...3]{
  title,
  description,
  "slug": slug.current,
  "thumbnail": mainThumbnail.asset->url
}`;

export const PRODUCT_NAV_QUERY = `*[_type == "product" && defined(slug.current)] {
  title,
  "slug": slug.current
}`;

export const BLOG_QUERY = `*[_type == "blog" && slug.current == $slug][0] {
  _id,
  title,
  date,
  description,
  thumbnail {
    asset->{ url },
    thumbnailDescription
  },
  content[] {
    ...,
    _type == 'quoteCard' => {
      
      personImage { asset->{ url } }, 
      quote,
      name,
      designation
    },
    
    _type == 'additionalText' => {
      text
    },
    
    _type == 'subHeadingSection' => {
      subHeading,
      bodyText
    }
  }
}`;

export const BLOGS_LIST_QUERY = `*[_type == "blog"] | order(date desc) {
  title,
  "slug": slug,
  date,
  description,
  "thumbnailUrl": thumbnail.asset->url,
  author-> {
    name,
    role,
    "avatarSrc": avatar.asset->url
  }
}`;

export const OTHER_INSIGHTS_QUERY = `*[_type == "blog" && slug.current != $slug][0...3]{
  title,
  "slug": slug.current,
  "thumbnail": thumbnail.asset->url
}`;
