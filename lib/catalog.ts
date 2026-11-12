export type Author = { id:string; name:string; bio:string; note:string; portrait:string };
export type Book = {id:string;title:string;authorId:string;genre:string;price:number;stock:number;cover:string;color:string;description:string;pages:number;format:string;featured:boolean;demo:boolean;preview:{title:string;text:string}[]};
export const authors:Author[]=[
{id:'ella',name:'Ella Marlow',bio:'Ella Marlow is a fictional essayist exploring the meeting point of everyday life, art, and attention. Her demonstration collection begins with a simple question: what happens when we stop walking past the world?',note:'“I wanted to make room for the things we almost miss.”',portrait:''},
{id:'noah',name:'Noah Vale',bio:'Noah Vale is a fictional writer and designer whose work imagines quieter relationships between people, objects, and spaces.',note:'“Silence has a shape. Sometimes it looks like a room.”',portrait:''},
{id:'iris',name:'Iris Wren',bio:'Iris Wren is a fictional naturalist and storyteller. Her imagined field notes celebrate small discoveries and the joy of wandering without a destination.',note:'“Wonder begins where the familiar becomes strange again.”',portrait:''},
{id:'mira',name:'Mira Sol',bio:'Mira Sol is a fictional novelist drawn to cities, thresholds, and the lives we might have led. Her imagined stories turn ordinary doors into possibilities.',note:'“Every doorway is a question.”',portrait:''},
{id:'leo',name:'Leo Ash',bio:'Leo Ash is a fictional novelist writing about unexpected companionship, late departures, and the distance between leaving and arriving.',note:'“The journey is sometimes the place you were looking for.”',portrait:''},
{id:'ada',name:'Ada Reed',bio:'Ada Reed is a fictional designer and essayist who looks for meaning in everyday objects, from a well-worn chair to the curve of a coffee cup.',note:'“Good design gives ordinary things a second life.”',portrait:''},
{id:'june',name:'June Alder',bio:'June Alder is a fictional writer mapping the overlooked landscapes at the edges of cities. Her imagined journeys begin where the pavement ends.',note:'“There is always a little wilderness close by.”',portrait:''},
{id:'emil',name:'Emil North',bio:'Emil North is a fictional poet writing about moonlit kitchens, sleepless windows, and the tender rituals that hold a day together.',note:'“Night makes room for the smallest thoughts.”',portrait:''}
];
const entries=[
['noticing','The Art of Noticing','ella','Art & Design',2400,24,'#e8e1cc','A gentle invitation to look a little closer. Essays on attention, everyday beauty, and the extraordinary hiding in plain sight.',192,'Clothbound hardcover'],
['silence','Forms of Silence','noah','Art & Design',3200,18,'#1647ba','A visual meditation on quiet spaces, sculptural forms, and the beauty of leaving things unsaid.',224,'Hardcover'],
['wonder','A Field Guide to Wonder','iris','Nature',2200,31,'#ced736','Pocket-sized adventures for curious minds. Rediscover the natural world, one small observation at a time.',160,'Paperback'],
['between','The World in Between','mira','Fiction',2600,16,'#a58bc6','An impossible city. A door that appears only at dusk. A story about all the lives waiting on the other side.',288,'Hardcover'],
['train','After the Last Train','leo','Fiction',2000,22,'#e84928','Two strangers miss the last train and find a city they have never truly seen. One night changes the journey.',256,'Paperback'],
['everyday','The Shape of Everyday','ada','Art & Design',3400,12,'#262626','A beautifully considered exploration of the objects that quietly shape the way we live.',208,'Hardcover'],
['atlas','Wild Atlas','june','Nature',2800,15,'#b4c6af','An invitation to get a little lost. Field notes, quiet trails, and the wild places just beyond the familiar.',240,'Hardcover'],
['hours','Small Hours','emil','Poetry',1800,28,'#efe2a1','Poems for the spaces between one day and the next. A companion for late nights and slow beginnings.',112,'Paperback']
] as const;
const excerpts=[
[
['A small beginning','The blue cup had been on the windowsill for three years before I noticed its shadow. Every morning it placed a small, perfect oval on the wall, then quietly took it back.\n\nNothing about the cup had changed. The difference was that, for once, I had nowhere else to be.'],
['The practice of looking','There is a kind of attention that asks nothing of the world. It does not name, collect, or photograph. It simply stays.\n\nOn your next walk, choose one thing you usually pass without seeing. A crack in the pavement. A curtain moving in an open window. Give it a moment that belongs entirely to it.'],
['Room for the ordinary','We keep waiting for beauty to arrive dressed for the occasion. But it is already here, in the crooked afternoon light and the familiar weight of a key.\n\nPerhaps a richer life does not always require more things. Perhaps it requires a little more room around the things we already have.']
],
[
['An empty room','The room was not empty. It held the last of the afternoon, a square of sunlight, and the patient sound of wood settling into itself.\n\nI moved the chair a few inches to the left. Suddenly the room could breathe.'],
['The space between','An object begins at its edge, but its meaning travels further. The bowl changes the table; the table changes the room.\n\nTo design a quiet space is to listen to these conversations, and know when to stop speaking.'],
['What remains','The most useful thing we removed was the need to explain. A stone on a shelf does not owe us a story.\n\nSometimes its weight, its pale surface, and the shadow beneath it are enough.']
],
[
['Begin at your doorstep','You do not need a mountain to begin an expedition. This morning a fern had unfolded behind the drainpipe. It was enough.\n\nI took a notebook, left the map at home, and followed the smallest green things.'],
['A map of questions','What lives beneath that stone? Why does the moss choose the northern wall? How many kinds of green can one leaf hold?\n\nThe best field guide does not answer everything. It teaches you to ask more carefully.'],
['A pocket-sized wilderness','Bring nothing home but a new way of looking. Leave the feather where you found it.\n\nBy tomorrow the rain may have rewritten the path. This is part of the invitation.']
],
[
['The door at dusk','At six thirteen, a door appeared between the bakery and the sea. Lina was certain it had not been there that morning.\n\nIt was painted the color of a memory she could not quite place. On the handle hung a key with her name on it.'],
['A city of almosts','Beyond the door stood a city made of unfinished decisions. Streets branched at every hesitation. Windows glowed with conversations never begun.\n\nA woman at the crossing handed Lina a map. It was blank except for one word: choose.'],
['The other side','She had expected a different life to feel different. Instead it smelled like rain and warm bread.\n\nSomewhere, in a room she had never seen, someone was waiting for her to come home.']
],
[
['Platform nine','The departure board blinked once, then settled into silence. Across the platform, a stranger was laughing.\n\n“Missed it?” he asked. I nodded. “Good,” he said. “There is a bakery that opens at four.”'],
['The sleeping city','Without the trains, the city belonged to other people: the cleaners, the bakers, the woman carrying a cello through the rain.\n\nWe walked slowly, as if we had been given permission to be somewhere we had never noticed.'],
['Almost morning','By the river, the first boats were waking. He told me his name, though by then it felt less important than the things we had already said.\n\nThe next train would leave in twenty minutes. For the first time all night, neither of us moved.']
],
[
['The familiar chair','The chair in my grandmother’s kitchen was an ordinary chair. Four legs, a wooden back, a small repair made with a different color of wood.\n\nNo design museum would have collected it. But it understood the shape of a person waiting for tea.'],
['Objects with patience','The best objects do not demand our attention. They wait until we need them, then do their work quietly.\n\nA handle tells a hand where to go. A well-made hinge keeps its promises.'],
['A useful kind of beauty','Beauty is sometimes a matter of proportion. Sometimes it is the simple relief of something working exactly as it should.\n\nThis is an argument for fewer things, chosen with more care.']
],
[
['Where the pavement ends','The map called it an unused piece of land. The fox, the brambles, and the three young birches disagreed.\n\nI stepped through a gap in the fence and found a whole country growing in the margins.'],
['The slow route','The straight path is rarely the interesting one. Follow the bend in the river. Take the track that seems to go nowhere.\n\nA landscape reveals itself at the speed of a person who is willing to stop.'],
['An unfinished atlas','I have left blank spaces on these maps. Not because there is nothing there, but because you should have the pleasure of finding it.\n\nTake a pencil. Add what the morning shows you.']
],
[
['The kitchen at two','One blue square of window.\nThe kettle finding its voice.\nOutside, the world\nhas put away its names.\n\nI hold a cup\nwith both hands\nas if it were a small\nand necessary light.'],
['Things that stay','The warm dent in a pillow.\nA sentence left unfinished.\nYour shoes beside the door.\n\nLove is sometimes\na room that keeps\na little of your shape\nwhen you are gone.'],
['Before morning','Let the day arrive slowly.\nLet the birds rehearse.\n\nThere is still a minute\nthat belongs to no one.\n\nSit here with me.\nWe will give it\na name later.']
]
];
export const books:Book[]=entries.map((e,i)=>({id:e[0],title:e[1],authorId:e[2],genre:e[3],price:e[4],stock:e[5],cover:`/covers/book-${i+1}.webp`,color:e[6],description:e[7],pages:e[8],format:e[9],featured:i<4,demo:true,preview:excerpts[i].map(([title,text])=>({title,text}))}));
export const defaultSettings={heroLine:'WORLDS WITHIN.',heroIntro:'Step into',shipping:490,freeShipping:5000,storeName:'Folio',shippingCountries:['FR','DE','BE','NL','ES','IT'],announcement:'A little curiosity goes a long way.',commerceEnabled:false};
export const euro=(cents:number)=>new Intl.NumberFormat('en-IE',{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(cents/100);
