import axios from 'axios';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const API_KEY = process.env.YOUTUBE_API_KEY;
const API_URL = 'https://www.googleapis.com/youtube/v3';

interface VideoDetails {
  title: string;
  description: string;
  viewCount: string;
  likeCount: string;
  channelTitle: string;
  thumbnails: {
    default: { url: string };
    medium: { url: string };
    high: { url: string };
  };
  publishedAt: string;
}

function extractVideoId(input: string): string | null {
  const videoIdRegex = /^[a-zA-Z0-9_-]{11}$/;
  const urlRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?([a-zA-Z0-9_-]{11})/;

  if (videoIdRegex.test(input)) {
    return input;
  } else {
    const match = input.match(urlRegex);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

async function searchYouTube(videoId: string): Promise<VideoDetails | undefined> {
  try {
    if (!API_KEY) {
      console.error('YouTube API key is not set. Please check your .env file.');
      return undefined;
    }
    const params = new URLSearchParams({
      part: 'snippet,statistics',
      id: videoId,
      key: API_KEY
    });
    const url = `${API_URL}/videos?${params.toString()}`;
    const response = await axios.get(url);
    const video = response.data.items[0];
    return {
      title: video.snippet.title,
      description: video.snippet.description,
      viewCount: video.statistics.viewCount,
      likeCount: video.statistics.likeCount,
      channelTitle: video.snippet.channelTitle,
      thumbnails: video.snippet.thumbnails,
      publishedAt: video.snippet.publishedAt,
    };
  } catch (error) {
    console.error('Error fetching YouTube data:', error);
    return undefined;
  }
}

function displayResults(video?: VideoDetails): void {
  if (video) {
    console.log(`Title: ${video.title}`);
    console.log(`Channel: ${video.channelTitle}`);
    console.log(`Description: ${video.description.slice(0, 100)}...`);
    console.log(`View Count: ${video.viewCount}`);
    console.log(`Like Count: ${video.likeCount}`);
    console.log(`Published At: ${video.publishedAt}`);
    console.log(`Thumbnail URL: ${video.thumbnails.medium.url}`);
  } else {
    console.log('No video details available.');
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function promptUser(): void {
  rl.question('Enter a search query (or type "exit" to quit): ', async (query) => {
    if (query.toLowerCase() === 'exit') {
      rl.close();
      return;
    }

    const videoId = extractVideoId(query);
    if (!videoId) {
      console.log('Invalid YouTube video ID or URL. Please try again.');
      promptUser();
      return;
    }

    const video = await searchYouTube(videoId);
    displayResults(video);
    promptUser();
  });
}

console.log('YouTube Search CLI');
promptUser();