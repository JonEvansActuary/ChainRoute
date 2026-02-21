#!/bin/bash
set -e

BASE="/Users/jonathanevans/Documents/GitHub/ChainRoute/ETHDenver2026Buidlathon/ChainRoute-Forge"
SHOTS="$BASE/presentation-screenshots"
ZOOMED="$BASE/video-production/zoomed"
AUDIO="$BASE/video-production/audio"
SEGS="$BASE/video-production/segments"
FINAL="$BASE/video-production"

mkdir -p "$ZOOMED" "$SEGS"

zoom_image() {
  local src="$1" dst="$2" cw="$3" ch="$4" cx="$5" cy="$6"
  ffmpeg -y -i "$src" \
    -vf "crop=${cw}:${ch}:${cx}:${cy},scale=1920:1080:flags=lanczos" \
    "$dst" 2>/dev/null
  echo "  Zoomed: $(basename "$dst") (crop ${cw}x${ch}+${cx}+${cy}, zoom $(echo "scale=2; 1920/$cw" | bc)x)"
}

echo "=== Zooming screenshots — revised framing ==="

# Slide 01 - Title: logo+title y≈150-450. 1.5x zoom, centered
zoom_image "$SHOTS/slide-01.png" "$ZOOMED/slide-01.png" 1280 720 320 30

# Slide 02 - Problem bullets: title y≈180, last bullet y≈440. 1.5x zoom
zoom_image "$SHOTS/slide-02.png" "$ZOOMED/slide-02.png" 1280 720 320 100

# Slide 07 - Applications grid: title y≈155, footer y≈490. 1.43x zoom (was 1.67x)
zoom_image "$SHOTS/slide-07.png" "$ZOOMED/slide-07.png" 1344 756 288 70

# Slide 09 - Protocol tree: title y≈65, diagram bottom y≈500. 1.25x zoom (was 1.43x)
zoom_image "$SHOTS/slide-09.png" "$ZOOMED/slide-09.png" 1536 864 192 20

# Slide 11 - 127-byte anchor: title y≈70, footer y≈580. 1.33x zoom (was 1.5x)
zoom_image "$SHOTS/slide-11.png" "$ZOOMED/slide-11.png" 1440 810 240 30

# Slide 12 - Arweave data: title y≈80, diagram bottom y≈490. 1.43x zoom
zoom_image "$SHOTS/slide-12.png" "$ZOOMED/slide-12.png" 1344 756 288 40

# Slide 13 - Verify flowchart: title y≈60, "Chain verified" y≈560. 1.25x zoom (was 1.43x)
zoom_image "$SHOTS/slide-13.png" "$ZOOMED/slide-13.png" 1536 864 192 20

# Slide 14 - Live example: title y≈110, links y≈490. 1.43x zoom (was 1.67x)
zoom_image "$SHOTS/slide-14.png" "$ZOOMED/slide-14.png" 1344 756 288 55

# Hyp slide 01 - Painting title: title y≈110, subtitle y≈500. 1.43x zoom (was 1.67x)
zoom_image "$SHOTS/hyp-slide-01.png" "$ZOOMED/hyp-slide-01.png" 1344 756 288 50

# Hyp slide 03 - Wide: text left x≈40, diagram labels extend to x≈1750+. 1.07x zoom
zoom_image "$SHOTS/hyp-slide-03.png" "$ZOOMED/hyp-slide-03.png" 1792 1008 20 30

# Slide 15 - CTA: logo y≈180, footer y≈450. 1.5x zoom
zoom_image "$SHOTS/slide-15.png" "$ZOOMED/slide-15.png" 1280 720 320 100

# Web app home - content from top. 1.43x zoom
zoom_image "$SHOTS/webapp-home.png" "$ZOOMED/webapp-home.png" 1344 756 288 0

# Web app create - form in upper area. 1.5x zoom
zoom_image "$SHOTS/webapp-create.png" "$ZOOMED/webapp-create.png" 1280 720 200 0

# Web app verify - form in upper area. 1.5x zoom
zoom_image "$SHOTS/webapp-verify.png" "$ZOOMED/webapp-verify.png" 1280 720 200 0

echo ""
echo "=== Building video segments ==="

get_dur() {
  ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$1"
}

make_segment() {
  local img="$1" audio="$2" out="$3" dur
  dur=$(get_dur "$audio")
  ffmpeg -y -loop 1 -i "$img" -i "$audio" \
    -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black,format=yuv420p" \
    -c:v libx264 -tune stillimage -preset medium -crf 18 \
    -c:a aac -b:a 192k -ar 44100 \
    -t "$dur" -shortest \
    -movflags +faststart \
    "$out" 2>/dev/null
  echo "  Built: $(basename "$out") (${dur}s)"
}

make_multi_image_segment() {
  local audio="$1" out="$2"
  shift 2
  local images=("$@")
  local dur num_imgs interval

  dur=$(get_dur "$audio")
  num_imgs=${#images[@]}
  interval=$(echo "$dur / $num_imgs" | bc -l)

  local filter=""
  for i in "${!images[@]}"; do
    filter+="[${i}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black,format=yuv420p,setpts=PTS-STARTPTS[v${i}];"
  done

  local concat_inputs=""
  for i in "${!images[@]}"; do
    dur_this=$(echo "$interval" | bc -l)
    filter+="[v${i}]trim=duration=${dur_this},setpts=PTS-STARTPTS[t${i}];"
    concat_inputs+="[t${i}]"
  done

  filter+="${concat_inputs}concat=n=${num_imgs}:v=1:a=0[outv]"

  local input_args=""
  for img in "${images[@]}"; do
    input_args+=" -loop 1 -t $interval -i $img"
  done

  ffmpeg -y $input_args -i "$audio" \
    -filter_complex "$filter" \
    -map "[outv]" -map "${num_imgs}:a" \
    -c:v libx264 -tune stillimage -preset medium -crf 18 \
    -c:a aac -b:a 192k -ar 44100 \
    -t "$dur" -shortest \
    -movflags +faststart \
    "$out" 2>/dev/null
  echo "  Built: $(basename "$out") (${dur}s) [${num_imgs} images]"
}

echo "Seg 1: Title"
make_segment "$ZOOMED/slide-01.png" "$AUDIO/seg01-title.mp3" "$SEGS/seg01.mp4"

echo "Seg 2: Problem"
make_segment "$ZOOMED/slide-02.png" "$AUDIO/seg02-problem.mp3" "$SEGS/seg02.mp4"

echo "Seg 3: Users"
make_segment "$ZOOMED/slide-07.png" "$AUDIO/seg03-users.mp3" "$SEGS/seg03.mp4"

echo "Seg 4: Protocol"
make_segment "$ZOOMED/slide-09.png" "$AUDIO/seg04-protocol.mp3" "$SEGS/seg04.mp4"

echo "Seg 5: Anchor"
make_segment "$ZOOMED/slide-11.png" "$AUDIO/seg05-anchor.mp3" "$SEGS/seg05.mp4"

echo "Seg 6: Arweave"
make_segment "$ZOOMED/slide-12.png" "$AUDIO/seg06-arweave.mp3" "$SEGS/seg06.mp4"

echo "Seg 7: Verify"
make_segment "$ZOOMED/slide-13.png" "$AUDIO/seg07-verify.mp3" "$SEGS/seg07.mp4"

echo "Seg 8: Live Example (3 images)"
make_multi_image_segment "$AUDIO/seg08-example.mp3" "$SEGS/seg08.mp4" \
  "$ZOOMED/slide-14.png" "$ZOOMED/hyp-slide-01.png" "$ZOOMED/hyp-slide-03.png"

echo "Seg 9: Web App (3 images)"
make_multi_image_segment "$AUDIO/seg09-webapp.mp3" "$SEGS/seg09.mp4" \
  "$ZOOMED/webapp-home.png" "$ZOOMED/webapp-create.png" "$ZOOMED/webapp-verify.png"

echo "Seg 10: CTA"
make_segment "$ZOOMED/slide-15.png" "$AUDIO/seg10-cta.mp3" "$SEGS/seg10.mp4"

echo ""
echo "=== Concatenating all segments ==="

cat > "$SEGS/concat.txt" << 'CONCAT'
file 'seg01.mp4'
file 'seg02.mp4'
file 'seg03.mp4'
file 'seg04.mp4'
file 'seg05.mp4'
file 'seg06.mp4'
file 'seg07.mp4'
file 'seg08.mp4'
file 'seg09.mp4'
file 'seg10.mp4'
CONCAT

ffmpeg -y -f concat -safe 0 -i "$SEGS/concat.txt" \
  -c:v libx264 -preset medium -crf 18 \
  -c:a aac -b:a 192k \
  -movflags +faststart \
  "$FINAL/ChainRoute-Forge-Demo.mp4" 2>/dev/null

echo ""
echo "=== DONE ==="
dur=$(get_dur "$FINAL/ChainRoute-Forge-Demo.mp4")
size=$(ls -lh "$FINAL/ChainRoute-Forge-Demo.mp4" | awk '{print $5}')
echo "Final video: ChainRoute-Forge-Demo.mp4"
echo "Duration: ${dur}s"
echo "Size: $size"
echo "Location: $FINAL/ChainRoute-Forge-Demo.mp4"
