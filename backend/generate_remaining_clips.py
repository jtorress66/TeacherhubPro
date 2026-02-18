"""
Generate remaining TeacherHubPro Tutorial Clips - Revised Prompts
"""
import os
import time
import shutil
from dotenv import load_dotenv
load_dotenv()

from emergentintegrations.llm.openai.video_generation import OpenAIVideoGeneration

# Revised clips with cleaner prompts to avoid moderation issues
clips = [
    {
        "name": "02_School_Setup",
        "prompt": """
Fade in from black over 2 seconds.

A bright, modern office space with a laptop on a clean white desk. 
A professional educator opens a settings page on their computer.
The screen shows form fields for organization name and logo.
Colorful icons animate onto the screen: a building, a phone, an envelope.
A green checkmark appears indicating successful save.
The scene ends with a preview of a branded document template.

Style: Clean, professional, modern office aesthetic, blue and white colors
Mood: Organized, efficient, satisfying completion
"""
    },
    {
        "name": "03_Classes_Setup",
        "prompt": """
Fade in from black over 2 seconds.

An overhead view of a tablet showing colorful category cards.
A hand taps to add a new category with a plus icon animation.
Form fields appear: name, level, subject type, time period.
Text animates smoothly into each field.
A grid of avatar circles fills in representing team members.
A success notification slides in from the right side.

Style: Bright, colorful, organized grid layout, cyan and green colors
Mood: Creative, organized, building something new
"""
    },
    {
        "name": "04_Calendar_Planner",
        "prompt": """
Fade in from black over 2 seconds.

A beautiful weekly calendar grid appears, initially empty.
Colorful task blocks smoothly animate and fill into each day.
The blocks are rainbow colored: red, orange, yellow, green, blue, purple.
Time labels appear on the left side.
The calendar transforms to show a detailed task view with bullet points.
Smooth zoom into one day showing organized content.

Style: Colorful calendar aesthetic, rainbow blocks, clean grid layout
Mood: Organized, productive, satisfying visual arrangement
"""
    },
    {
        "name": "05_AI_Magic",
        "prompt": """
Fade in from black over 2 seconds.

A glowing purple button labeled AI appears on screen.
Someone clicks the button and purple sparkles emanate outward.
Digital text flows onto the screen like magical ink.
Lines of organized content appear one by one.
Stars and sparkles surround the generated content.
A friendly robot icon gives approval with a star animation.

Style: Magical, futuristic, purple and blue sparkles, wonder and amazement
Mood: Exciting, innovative, magical assistance
"""
    },
    {
        "name": "06_Export_Share",
        "prompt": """
Fade in from black over 2 seconds.

A completed document displayed on a computer screen.
An export button is clicked with a satisfying animation.
The digital document transforms with a paper airplane effect.
A beautiful printed document materializes on a wooden desk.
The camera zooms to show professional formatting with a logo header.
Multiple organized documents stack neatly, ready to share.

Style: Professional, satisfying transformation, print quality documents
Mood: Accomplished, ready to share, professional output
"""
    },
    {
        "name": "07_Success_Finale",
        "prompt": """
Fade in from black over 2 seconds.

A confident professional stands in a bright, modern workspace.
They hold a tablet showing their organized digital workspace.
Floating icons appear around them: checkmarks, calendars, stars.
The scene pulls back to show a happy, productive environment.
Text fades in elegantly: Plan Smarter. Work Better.
A logo appears with a gentle golden glow at the end.

Style: Inspiring, warm golden lighting, successful achievement
Mood: Triumphant, accomplished, empowering
"""
    }
]

def generate_clip(clip_info, clip_number):
    """Generate a single clip"""
    print(f"\n{'='*60}")
    print(f"🎬 Generating clip {clip_number}: {clip_info['name']}")
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
    print("🎬 Generating remaining TeacherHubPro Tutorial Clips")
    print("📝 6 clips to generate...")
    print("⏳ Estimated time: 25-35 minutes total\n")
    
    successful = 0
    
    for i, clip in enumerate(clips, 2):
        result = generate_clip(clip, i)
        if result:
            successful += 1
        
        if i < len(clips) + 1:
            print(f"\n⏸️  Brief pause before next clip...")
            time.sleep(5)
    
    print(f"\n{'='*60}")
    print(f"🎉 GENERATION COMPLETE")
    print(f"✅ Successful: {successful}/{len(clips)}")
    print(f"{'='*60}")
    print("ALL_DONE")

if __name__ == "__main__":
    main()
