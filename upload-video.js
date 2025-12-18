// upload-video.js
import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

// 1. Configure Supabase
const supabaseUrl = 'https://xivybitbnmdubnpztxrf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpdnliaXRibm1kdWJucHp0eHJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5Nzc4NTYsImV4cCI6MjA4MDU1Mzg1Nn0.g5DOQzR5wJfhtpdfnx5i8g68tZyuBUHNWCIBsw40XfU' // Use service key for server-side
const supabase = createClient(supabaseUrl, supabaseKey)

// 2. Specify your video file in the Vue public folder
// Example: public/videos/video1.mp4
const projectRoot = process.cwd() // current project root
const filePath = path.join(projectRoot, 'public', 'videos', 'video1.mp4') 
const fileName = 'video1.mp4'   // name in Supabase bucket
const bucketName = 'media'      // your bucket

async function uploadVideo() {
  try {
    const fileBuffer = fs.readFileSync(filePath) // read local file

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(`videos/${fileName}`, fileBuffer, { upsert: true })

    if (error) throw error

    const { publicURL } = supabase.storage
      .from(bucketName)
      .getPublicUrl(`videos/${fileName}`)

    console.log('Video uploaded successfully!')
    console.log('Public URL:', publicURL)
  } catch (err) {
    console.error('Error uploading video:', err.message)
  }
}

uploadVideo()
