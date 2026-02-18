"""
Generate Higher Quality TeacherHubPro Tutorial Video using Sora 2 Pro
"""
import os
from dotenv import load_dotenv
load_dotenv()

from emergentintegrations.llm.openai.video_generation import OpenAIVideoGeneration

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

Style: Modern, professional, warm educational atmosphere, cinematic quality, smooth transitions, high detail, sharp focus, 4K quality rendering
Mood: Inspiring, efficient, organized, empowering for teachers
"""

print('🎬 Generating video with Sora 2 Pro (higher quality)...')
print('⏳ This may take 5-10 minutes...')

video_gen = OpenAIVideoGeneration(api_key=os.environ['EMERGENT_LLM_KEY'])

# Try sora-2-pro for potentially better quality
video_bytes = video_gen.text_to_video(
    prompt=prompt,
    model='sora-2-pro',
    size='1280x720',
    duration=12,
    max_wait_time=900
)

if video_bytes:
    output_path = '/app/TeacherHubPro_Tutorial_Pro.mp4'
    video_gen.save_video(video_bytes, output_path)
    import shutil
    shutil.copy(output_path, '/app/frontend/public/TeacherHubPro_Tutorial_Pro.mp4')
    print(f'✅ Video saved to: {output_path}')
    print(f'📊 File size: {os.path.getsize(output_path) / (1024*1024):.2f} MB')
    print('GENERATION_COMPLETE')
else:
    print('❌ Failed')
    print('GENERATION_FAILED')
