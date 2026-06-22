// Replace these with your actual credentials from developer.adzuna.com
const APP_ID = '095538e5';
const APP_KEY = '89a5c28de42c59ec27d3fad4ae749bf6';
const COUNTRY = 'us'; // 'us', 'gb', 'ca', 'au', etc.

// Define the shape of the data we expect from Adzuna
interface AdzunaJob {
  salary_min?: number;
  salary_max?: number;
  title: string;
  company: { display_name: string };
}

interface AdzunaResponse {
  results: AdzunaJob[];
  count: number;
}

/**
 * Fetches and calculates salary statistics for a given job and location
 */
async function getSalaryData(
  jobTitle: string,
  location: string,
  experienceLevel: string = '',
) {
  // Combine experience level with job title (e.g., "Senior Software Engineer")
  const searchQuery = experienceLevel
    ? `${experienceLevel} ${jobTitle}`
    : jobTitle;

  // Build the URL parameters
  const params = new URLSearchParams({
    app_id: APP_ID,
    app_key: APP_KEY,
    what: searchQuery,
    where: location,
    results_per_page: '50', // Grab 50 jobs to get a statistically relevant sample
    'content-type': 'application/json',
  });

  const url = `https://api.adzuna.com/v1/api/jobs/${COUNTRY}/search/1?${params}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Adzuna API Error: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as AdzunaResponse;
    const jobs = data.results;

    // Filter out jobs that don't explicitly declare a salary range
    const jobsWithSalaries = jobs.filter(
      (job) => job.salary_min !== undefined && job.salary_max !== undefined,
    );

    if (jobsWithSalaries.length === 0) {
      console.log(
        `No public salary data found for "${searchQuery}" in ${location}.`,
      );
      return;
    }

    // Initialize our calculation variables
    let lowestMin = Infinity;
    let highestMax = 0;
    let totalAverageSum = 0;

    // Loop through the data to find the absolute min, absolute max, and sum the averages
    jobsWithSalaries.forEach((job) => {
      // Find absolute min and max bounds across all postings
      if (job.salary_min! < lowestMin) lowestMin = job.salary_min!;
      if (job.salary_max! > highestMax) highestMax = job.salary_max!;

      // Calculate the midpoint for this specific job, then add it to our sum
      const jobMidpoint = (job.salary_min! + job.salary_max!) / 2;
      totalAverageSum += jobMidpoint;
    });

    // Calculate the overall average across all postings
    const overallAverage = Math.round(
      totalAverageSum / jobsWithSalaries.length,
    );

    // Output the results
    console.log(`\n--- Market Salary Data ---`);
    console.log(`Role:      ${searchQuery}`);
    console.log(`Location:  ${location}`);
    console.log(`Sample:    ${jobsWithSalaries.length} verified postings`);
    console.log(`--------------------------`);
    console.log(`Min:       $${lowestMin.toLocaleString()}`);
    console.log(`Average:   $${overallAverage.toLocaleString()}`);
    console.log(`Max:       $${highestMax.toLocaleString()}\n`);
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
}

// --- Run the Script ---
// Example 1: Mid-level developer
getSalaryData('Software Engineer', 'San Francisco', 'Mid-Level');

// Example 2: Senior developer
getSalaryData('Software Engineer', 'San Francisco', 'Senior');
