"""
Generate Multiple TeacherHubPro Tutorial Clips using Sora 2 Pro
Each clip starts with a clear establishing shot to avoid cut-off beginnings
"""
import os
import time
from dotenv import load_dotenv
load_dotenv()

from emergentintegrations.llm.openai.video_generation import OpenAIVideoGeneration

# Define clips with prompts that have clear beginnings
clips = [
    {
        "name": "01_Welcome_Intro",
        "prompt": """
The video begins with a 2-second fade-in from black. 

Then reveals: A warm, inviting modern classroom at sunrise. Golden light streams through large windows. 
The camera slowly pans across the room showing organized desks and a clean whiteboard.
A friendly female teacher in professional attire sits at her desk, opens her laptop, and smiles warmly at the camera.
The TeacherHubPro logo appears elegantly on screen with a subtle glow effect.
Text fades in: "Welcome to TeacherHubPro"

Style: Cinematic, warm lighting, professional, inviting atmosphere
Starting: Fade from black, slow reveal
"""
    },
    {
        "name": "02_School_Settings",
        "prompt": """
The video begins with a 2-second fade-in from black.

Then shows: A close-up of hands typing on a sleek laptop keyboard.
The camera pulls back to reveal a teacher customizing school settings on screen.
Digital UI elements float beside the laptop showing: school logo upload, school name field, address fields.
The teacher clicks "Save" and a satisfying checkmark animation appears.
A school building icon transforms into a branded document preview.

Style: Modern tech aesthetic, clean UI elements, professional blue color scheme
Starting: Fade from black, close-up establishing shot
"""
    },
    {
        "name": "03_Create_Classes",
        "prompt": """
The video begins with a 2-second fade-in from black.

Then reveals: An overhead shot of a teacher's organized desk with a tablet displaying colorful class cards.
The camera smoothly zooms in as the teacher's hand taps to create a new class.
A form appears with fields: Class Name, Grade Level, Subject, School Year.
Each field fills in with smooth typing animations.
Student avatar icons appear in a neat grid as the class is created.
A green success notification slides in from the right.

Style: Bright, organized, educational aesthetic with cyan and green accents
Starting: Fade from black, overhead establishing shot
"""
    },
    {
        "name": "04_Weekly_Planner",
        "prompt": """
The video begins with a 2-second fade-in from black.

Then shows: A beautiful weekly calendar grid filling the screen, empty at first.
The camera follows as colorful lesson blocks smoothly animate into each day slot.
A teacher's hand uses a stylus to drag and arrange lesson cards.
The weekly view transforms to show a detailed lesson plan with objectives, activities, and assessments.
Time indicators and subject labels appear with smooth transitions.

Style: Colorful, organized, calendar aesthetic with rainbow lesson blocks
Starting: Fade from black, empty calendar establishing shot
"""
    },
    {
        "name": "05_AI_Assistant",
        "prompt": """
The video begins with a 2-second fade-in from black.

Then reveals: A magical scene where a teacher clicks a glowing "Generate with AI" button.
Purple and blue sparkles emanate from the button.
AI-generated text flows onto the screen like digital ink, forming lesson objectives and activities.
The teacher watches in amazement as a complete lesson plan materializes.
A friendly robot assistant icon gives a thumbs up.
Text appears: "AI-Powered Lesson Generation"

Style: Magical, futuristic, purple and blue sparkle effects, wonder and amazement
Starting: Fade from black, focus on glowing button
"""
    },
    {
        "name": "06_Export_PDF",
        "prompt": """
The video begins with a 2-second fade-in from black.

Then shows: A completed lesson plan on screen with school branding visible.
The teacher clicks an "Export to PDF" button with a satisfying click animation.
The digital document transforms and floats off the screen.
It materializes as a beautiful printed document landing on the desk.
The camera zooms in to show the professional layout with school logo header.
A stack of organized lesson plans appears, ready to share.

Style: Professional, satisfying transformation effect, print-quality documents
Starting: Fade from black, completed plan on screen
"""
    },
    {
        "name": "07_Ready_To_Start",
        "prompt": """
The video begins with a 2-second fade-in from black.

Then reveals: A confident teacher standing in front of an engaged classroom.
Students raise their hands enthusiastically.
The teacher holds a tablet showing their TeacherHubPro lesson plan.
The camera pulls back to show the whole happy classroom scene.
Floating UI elements show: checkmarks for completed setup, organized calendar, happy student faces.
Text fades in elegantly: "Plan Smarter. Teach Better."
The TeacherHubPro logo appears with a gentle glow.

Style: Inspiring, warm, successful teaching moment, triumphant feeling
Starting: Fade from black, teacher silhouette reveal
"""
    }
]

def generate_clip(clip_info, clip_number, total_clips):
    """Generate a single clip"""
    print(f"\n{'='*60}")
    print(f"🎬 Generating clip {clip_number}/{total_clips}: {clip_info['name']}")
    print(f"{'='*60}")
    
    video_gen = OpenAIVideoGeneration(api_key=os.environ['EMERGENT_LLM_KEY'])
    
    try:
        video_bytes = video_gen.text_to_video(
            prompt=clip_info['prompt'],
            model='sora-2-pro',
            size='1280x720',
            duration=12,
            max_wait_time=900
        )
        
        if video_bytes:
            output_path = f"/app/TeacherHubPro_{clip_info['name']}.mp4"
            video_gen.save_video(video_bytes, output_path)
            
            # Copy to public folder
            import shutil
            shutil.copy(output_path, f"/app/frontend/public/TeacherHubPro_{clip_info['name']}.mp4")
            
            file_size = os.path.getsize(output_path) / (1024*1024)
            print(f"✅ Clip saved: {output_path}")
            print(f"📊 File size: {file_size:.2f} MB")
            return True
        else:
            print(f"❌ Failed to generate clip: {clip_info['name']}")
            return False
            
    except Exception as e:
        print(f"❌ Error generating {clip_info['name']}: {str(e)}")
        return False

def main():
    print("🎬 Starting TeacherHubPro Tutorial Clip Generation")
    print("📝 Generating 7 clips with clear beginnings...")
    print("⏳ This will take approximately 30-40 minutes total\n")
    
    successful = 0
    failed = 0
    
    for i, clip in enumerate(clips, 1):
        result = generate_clip(clip, i, len(clips))
        if result:
            successful += 1
        else:
            failed += 1
        
        # Small delay between clips
        if i < len(clips):
            print(f"\n⏸️  Waiting 10 seconds before next clip...")
            time.sleep(10)
    
    print(f"\n{'='*60}")
    print(f"🎉 GENERATION COMPLETE")
    print(f"✅ Successful: {successful}/{len(clips)}")
    print(f"❌ Failed: {failed}/{len(clips)}")
    print(f"{'='*60}")
    print("ALL_CLIPS_COMPLETE")

if __name__ == "__main__":
    main()
