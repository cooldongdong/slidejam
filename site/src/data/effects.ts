// Every effect in the gallery (effects.html), for the effects page.
// Keep in step with effects.html: same ids, same order.
export const groups = [
  {
    "id": "basics",
    "zh": "基本",
    "en": "Basics"
  },
  {
    "id": "text",
    "zh": "文字",
    "en": "Text"
  },
  {
    "id": "data",
    "zh": "數字與資料",
    "en": "Numbers & data"
  },
  {
    "id": "shots",
    "zh": "截圖",
    "en": "Screenshots"
  },
  {
    "id": "walk",
    "zh": "操作示範",
    "en": "Walkthroughs"
  },
  {
    "id": "layout",
    "zh": "版面與外框",
    "en": "Layout & frames"
  }
];

export const effects = [
  {
    "id": "theme",
    "group": "basics",
    "zh": "配色與風格",
    "en": "Themes",
    "zhDesc": "選一套主題，或直接調顏色；整份圖鑑會跟著變。調好按「複製這組設定」，貼進你簡報的 <style>，或存成一個主題檔。",
    "enDesc": "Pick a theme or tune colours live; copy the result into your deck."
  },
  {
    "id": "stagger",
    "group": "basics",
    "zh": "依序浮出",
    "en": "Stagger",
    "zhDesc": "每一頁的東西照順序浮上來，最常用。按 R 重播。",
    "enDesc": "Things on a slide rise in, one after another."
  },
  {
    "id": "step",
    "group": "basics",
    "zh": "按一下才出現",
    "en": "Steps",
    "zhDesc": "按 → 一次出現一組，全部出完才翻頁。也可以讓舊的東西在同一下消失（這頁就是）。",
    "enDesc": "Each → reveals the next group; old ones can leave on the same press."
  },
  {
    "id": "bars",
    "group": "data",
    "zh": "長條圖",
    "en": "Bars",
    "zhDesc": "進到這頁時，長條一起長出來。想強調的那幾條加 hot 會變成橘色。",
    "enDesc": "A bar chart that grows in; hot bars stand out."
  },
  {
    "id": "count",
    "group": "data",
    "zh": "數字跳動",
    "en": "Count",
    "zhDesc": "從 0 數到寫在裡面的數字。逗號、百分比、小數點都照原樣保留。",
    "enDesc": "Counts up to the number, keeping commas and %."
  },
  {
    "id": "type",
    "group": "text",
    "zh": "打字",
    "en": "Type",
    "zhDesc": "一個字一個字打出來，適合搜尋框、對話、提問。",
    "enDesc": "Text types itself out, letter by letter."
  },
  {
    "id": "mark",
    "group": "text",
    "zh": "螢光筆",
    "en": "Mark",
    "zhDesc": "一段文字裡，把重點畫上螢光筆。",
    "enDesc": "A highlighter sweeps across the key phrase."
  },
  {
    "id": "pan",
    "group": "shots",
    "zh": "長截圖捲動",
    "en": "Pan",
    "zhDesc": "整頁的長截圖放進框裡，慢慢往下捲再捲回來。捲多遠會自己算。",
    "enDesc": "A tall screenshot scrolls down and back inside its frame."
  },
  {
    "id": "zoom",
    "group": "shots",
    "zh": "推近",
    "en": "Zoom",
    "zhDesc": "慢慢推近截圖上的一點，再拉回來。加 data-once 就只推一次。",
    "enDesc": "Pushes in on one spot of a screenshot."
  },
  {
    "id": "cycle",
    "group": "shots",
    "zh": "輪播",
    "en": "Cycle",
    "zhDesc": "幾張圖輪流淡入淡出，適合「同一個東西的幾個樣子」。",
    "enDesc": "Pictures cross-fade, one after another."
  },
  {
    "id": "clickpath",
    "group": "walk",
    "zh": "游標示範",
    "en": "Click path",
    "zhDesc": "游標在幾張截圖上移動、點擊、換頁，示範「要點哪裡才找得到」。會一直循環。",
    "enDesc": "A cursor clicks through screenshots to show where things are."
  },
  {
    "id": "orbit",
    "group": "data",
    "zh": "循環流程",
    "en": "Orbit",
    "zhDesc": "幾個步驟排成一圈，一個點沿著圈走，走到哪個就亮哪個。適合「會回到起點」的流程。",
    "enDesc": "Steps around a loop light up as a dot travels past."
  },
  {
    "id": "assemble",
    "group": "layout",
    "zh": "飛進來組合",
    "en": "Assemble",
    "zhDesc": "一組卡片從四散的位置飛進來，拼成格子。適合「這些合起來就是解法」。",
    "enDesc": "Cards fly in from all over and settle into a grid."
  },
  {
    "id": "bento",
    "group": "layout",
    "zh": "功能格狀總覽",
    "en": "Bento",
    "zhDesc": "格子從離它最近的畫面邊飛進來，卡位時微微回彈，整面再慢慢拉近。每格裡面放別的效果：pan、slot、pop、compare、stack、type、terminal。",
    "enDesc": "A feature grid flies in from the edges; every tile keeps moving."
  },
  {
    "id": "pop",
    "group": "layout",
    "zh": "依序彈出",
    "en": "Pop",
    "zhDesc": "一組小東西一個接一個「啵」地彈出來，最後微微回彈。適合標籤、色塊、logo 牆。按 R 重播看比較清楚。",
    "enDesc": "Small things pop in one by one with a bounce."
  },
  {
    "id": "compare",
    "group": "layout",
    "zh": "左右對照",
    "en": "Compare",
    "zhDesc": "兩張圖疊在一起，一條線左右來回掃：線左邊是第一張，右邊是第二張。適合淺色／深色、改版前後。",
    "enDesc": "A line sweeps back and forth between two pictures."
  },
  {
    "id": "stack",
    "group": "layout",
    "zh": "卡片疊",
    "en": "Stack",
    "zhDesc": "一疊卡片，最上面那張每隔一陣子換到最底下，下一張浮上來。適合「隨機抽一個」「還有很多」。",
    "enDesc": "A pile of cards; the front one keeps moving to the back."
  },
  {
    "id": "spot",
    "group": "shots",
    "zh": "聚光燈",
    "en": "Spotlight",
    "zhDesc": "截圖其他地方變暗，只亮一塊。有好幾塊的話，每按一下 → 移到下一塊。",
    "enDesc": "Dims a screenshot except for the part you talk about."
  },
  {
    "id": "morph",
    "group": "shots",
    "zh": "頁面重組",
    "en": "Morph",
    "zhDesc": "用真的網站做出來：游標點一張卡片，卡片長成整頁，標題飛到新位置，其他內容浮上來。",
    "enDesc": "Click a real site and the page rebuilds itself, captured live."
  },
  {
    "id": "map",
    "group": "walk",
    "zh": "地圖",
    "en": "Map",
    "zhDesc": "真的地圖，點位一個個掉下來；每按一下 →，飛到下一個地點。加 data-auto 就自己飛。需要網路。",
    "enDesc": "A real map: pins drop in, then it flies from place to place."
  },
  {
    "id": "live",
    "group": "walk",
    "zh": "真網站",
    "en": "Live site",
    "zhDesc": "把網站直接放進投影片，可以現場點。用手機的寬度畫再縮小，就是手機上的樣子。需要網路。",
    "enDesc": "A real website running inside the slide, at phone or desktop size."
  },
  {
    "id": "frames",
    "group": "layout",
    "zh": "瀏覽器／手機框",
    "en": "Frames",
    "zhDesc": "截圖、影片、真網站外面套一個框，一看就知道是網頁還是手機。",
    "enDesc": "Browser and phone frames around screenshots or live pages."
  },
  {
    "id": "video",
    "group": "basics",
    "zh": "影片轉場",
    "en": "Video",
    "zhDesc": "一整頁只放一支影片，翻到就自動播放。適合段落之間的轉場。",
    "enDesc": "A full-slide video that plays when you reach it."
  },
  {
    "id": "letters",
    "group": "text",
    "zh": "逐字浮現",
    "en": "Letters",
    "zhDesc": "標題一個字一個字從模糊裡浮上來。適合開場、段落標題。",
    "enDesc": "Each character rises out of a blur."
  },
  {
    "id": "rotate",
    "group": "text",
    "zh": "換詞輪播",
    "en": "Rotate",
    "zhDesc": "一句話裡的某個詞一直換，講「可以做很多事」很好用。",
    "enDesc": "One word in a sentence keeps changing."
  },
  {
    "id": "flap",
    "group": "text",
    "zh": "翻牌看板",
    "en": "Flap",
    "zhDesc": "像車站的翻牌看板，每個字先亂翻幾下再停住。適合數字、名單。",
    "enDesc": "A split-flap board: letters flip before they land."
  },
  {
    "id": "slot",
    "group": "data",
    "zh": "數字滾輪",
    "en": "Slot",
    "zhDesc": "每一位數像里程表一樣各自滾動再停下。跟 count 比，更有「機器在跑」的感覺。",
    "enDesc": "Each digit rolls on its own reel, like an odometer."
  },
  {
    "id": "particles",
    "group": "text",
    "zh": "粒子聚字",
    "en": "Particles",
    "zhDesc": "滿畫面的點飄過來，聚成一行字。適合結尾的網址、品牌名。只支援一行字。",
    "enDesc": "Dots drift in and gather into a title."
  },
  {
    "id": "textmask",
    "group": "text",
    "zh": "文字遮罩",
    "en": "Text mask",
    "zhDesc": "超大的字裡面填一張圖，圖慢慢移動。適合當段落的封面。",
    "enDesc": "Huge letters filled with a slowly drifting picture."
  },
  {
    "id": "tilt",
    "group": "shots",
    "zh": "3D 斜放",
    "en": "Tilt",
    "zhDesc": "截圖斜躺著再轉正（左），或左右輕輕轉（右）。data-mode=\"hold\" 會一直斜著慢慢飄。",
    "enDesc": "A screenshot lies tilted in 3D, then swings flat."
  },
  {
    "id": "explode",
    "group": "shots",
    "zh": "拆層",
    "en": "Explode",
    "zhDesc": "一張卡片拆成好幾層往上浮，每層拉一條線說明它是什麼。適合解釋「這個設計由哪些部分組成」。",
    "enDesc": "Layers of a design lift apart, each with a label."
  },
  {
    "id": "parallax",
    "group": "shots",
    "zh": "景深",
    "en": "Parallax",
    "zhDesc": "前中後幾層，越前面動得越多，滑鼠移動時也會跟著。讓靜態截圖有空間感。",
    "enDesc": "Layers at different depths drift and follow the mouse."
  },
  {
    "id": "dive",
    "group": "shots",
    "zh": "鑽進去",
    "en": "Dive",
    "zhDesc": "往截圖的某一點一直推近，推到底就變成下一頁。加 data-on=\"step\" 就等你按 → 才鑽。",
    "enDesc": "Zooms into one spot until it becomes the next page."
  },
  {
    "id": "wipe",
    "group": "shots",
    "zh": "擦過去",
    "en": "Wipe",
    "zhDesc": "一條色帶斜斜掃過，後面露出第二張。適合改版前後、淺色深色對比。",
    "enDesc": "A coloured band sweeps across, revealing the after picture."
  },
  {
    "id": "hotspots",
    "group": "shots",
    "zh": "熱點導覽",
    "en": "Hotspots",
    "zhDesc": "截圖上幾個會跳動的點，每按一下 → 打開下一個說明。加 data-auto 就自己輪流。",
    "enDesc": "Pulsing dots on a screenshot open notes one by one."
  },
  {
    "id": "story",
    "group": "walk",
    "zh": "步驟配畫面",
    "en": "Story",
    "zhDesc": "左邊步驟、右邊畫面，亮到哪一步就換哪一張。自動輪流，或 data-on=\"step\" 按一下換一步。",
    "enDesc": "A list of steps beside screens that change with them."
  },
  {
    "id": "chat",
    "group": "walk",
    "zh": "聊天對話",
    "en": "Chat",
    "zhDesc": "訊息一則一則跳出來，對方會先「打字中…」。適合講「怎麼被分享出去」。",
    "enDesc": "Messages pop in, with typing dots before each reply."
  },
  {
    "id": "terminal",
    "group": "walk",
    "zh": "終端機",
    "en": "Terminal",
    "zhDesc": "指令自己打出來，按下去之後回應一行一行印出。適合講 API、開放資料。",
    "enDesc": "A command types itself, then the output prints."
  },
  {
    "id": "tunnel",
    "group": "data",
    "zh": "名稱隧道",
    "en": "Tunnel",
    "zhDesc": "一大串名字貼在隧道牆上往你衝過來。講「有這麼多」的時候很有感。",
    "enDesc": "Names stream past on the walls of a tunnel."
  },
  {
    "id": "network",
    "group": "data",
    "zh": "議題星團",
    "en": "Network",
    "zhDesc": "每個議題是一顆星，專案是圍著它的小點，整團在 3D 裡慢慢轉。看得出哪裡多、哪裡少。",
    "enDesc": "Topics and their projects as a slowly turning 3D cluster."
  },
  {
    "id": "ring",
    "group": "data",
    "zh": "圓環進度",
    "en": "Ring",
    "zhDesc": "一圈環慢慢填到比例。裡面的數字可以再加 count 一起跳。",
    "enDesc": "A progress ring fills to its share."
  },
  {
    "id": "feature",
    "group": "layout",
    "zh": "輪流當主角",
    "en": "Feature",
    "zhDesc": "一組格子輪流有一格變大，其他格子讓位。適合一次介紹好幾個功能。",
    "enDesc": "Tiles take turns being the big one."
  },
  {
    "id": "swarm",
    "group": "data",
    "zh": "蜂群飛入",
    "en": "Swarm",
    "zhDesc": "一大堆小東西從畫面深處衝出來，排成整齊的一片。跟 assemble 比，適合「很多很多個」。",
    "enDesc": "Lots of small things rush in from deep space."
  },
  {
    "id": "collapse",
    "group": "layout",
    "zh": "收成一個網址",
    "en": "Collapse",
    "zhDesc": "畫面上的東西全部縮進中間，最後只剩一行字。適合結尾。",
    "enDesc": "Everything shrinks into the centre, leaving one line."
  },
  {
    "id": "devices",
    "group": "layout",
    "zh": "多裝置",
    "en": "Devices",
    "zhDesc": "桌機、平板、手機排在一起，一看就知道「哪裡都能用」。桌機也可以換成 laptop（筆電）。",
    "enDesc": "Desktop, tablet and phone side by side."
  }
];
