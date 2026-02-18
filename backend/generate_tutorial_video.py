"""
Generate TeacherHubPro Tutorial Video using Sora 2
This script creates a downloadable MP4 video for personal use.
"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from emergentintegrations.llm.openai.video_generation import OpenAIVideoGeneration


def generate_teacherhubpro_video():
    """Generate the TeacherHubPro tutorial video"""
    
    # Comprehensive prompt for an educational app promotional video
    prompt = """
    A smooth, professional animated tutorial video for a teacher productivity app called TeacherHubPro.
    
    The video shows:
    - A modern, clean classroom setting with a teacher at their desk
    - The teacher using a laptop/tablet to plan lessons
    - Digital lesson plan documents appearing on screen with colorful, organized layouts
    - Calendar views showing weekly lesson schedules
    - AI sparkle effects highlighting automated lesson generation
    - Students engaged in a classroom while teacher confidently teaches from their digital plans
    - The scene transitions smoothly between planning at desk and teaching in classroom
    - Professional blue and cyan color scheme throughout
    - Clean, modern UI elements floating in the scene showing grades, attendance, and lesson plans
    - End with teacher smiling, satisfied with organized lesson planning
    
    Style: Modern, professional, warm educational atmosphere, cinematic quality, smooth transitions
    Mood: Inspiring, efficient, organized, empowering for teachers
    """
    
    print("🎬 Starting video generation for TeacherHubPro tutorial...")
    print("📝 This may take 5-10 minutes. Please wait...")
    
    try:
        # Create video generator instance
        video_gen = OpenAIVideoGeneration(api_key=os.environ['EMERGENT_LLM_KEY'])
        
        # Generate the video - using max duration (12 seconds) for more content
        video_bytes = video_gen.text_to_video(
            prompt=prompt,
            model="sora-2",
            size="1280x720",  # Standard HD
            duration=12,      # Maximum duration
            max_wait_time=900  # 15 minutes max wait
        )
        
        if video_bytes:
            output_path = "/app/TeacherHubPro_Tutorial.mp4"
            video_gen.save_video(video_bytes, output_path)
            print(f"✅ Video successfully generated!")
            print(f"📁 Saved to: {output_path}")
            print(f"📊 File size: {os.path.getsize(output_path) / (1024*1024):.2f} MB")
            return output_path
        else:
            print("❌ Video generation returned no data")
            return None
            
    except Exception as e:
        print(f"❌ Error generating video: {str(e)}")
        import traceback
        traceback.print_exc()
        return None


if __name__ == "__main__":
    result = generate_teacherhubpro_video()
    if result:
        print(f"\n🎉 Your video is ready at: {result}")
    else:
        print("\n⚠️ Video generation failed. Please check the error messages above.")
