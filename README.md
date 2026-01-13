📁Cz-ct-mouleonfg└dtaba.js#MongoDBcoctio configuraioncllers├uthCorler.j#Authentin ndpoinchtAsignnCotrlerj#Assign anagmenhMtlsCntrolrj#Meral upload/maaen├lgeCoror.j# Cogaam
│├── sujctsCnollr.js#mnagmnt│└──rCono.jsUsm├──miw/│ ├──ahMddle.jJWThen│   ├──prpatddwr.jChtacpvid│└──leMddlew.j  #Rol-badacscro
├──mde/│├──Ur.j Usch│├──Cege.j#Cghma│  ├──Subje.j#SubjtchmaRomI│ ├── R.js# Ch oom chema│├──Papat.j# Ro pripnthma│ ├── .js#schma(Lampotmestmp)
│ ├── ChaMerial.j      # Maeil shema│├──ChAinm.js    # Astchema│ ├── Message.j#Rdceipchma│ ├── Stu.js   # Tndic schema│├── MsagQuueLog.js#Msag quueogch│ └── ChatK.j#E keyssch (sub)├──pblc/│├──ndxtl#t lnt│ ├──d.hm#Amsbd│ ├──fclt.h #Fauly ord│├──u.m#Studdahboard│└──ud/ma/ #Marauoadiryrutes├uh   Autherutchat#ChatroutmerialsMerialutsssgmens  # AssgmenroutscollsCollouubjs        Subjrouts└ers#Usr manmnt rot
├──rvis/├uhSevc      Authetiaic
│   ├── participantService.js # Partipant management├nt
│   ├── rollUtils.js         # Roll umber utilities
│   └── sockeService.js    # Socket.IO servicesripts├sedDaa.jsDatabasseding crip
│  ├── raeUser.js     #Uer eation utilyetup-collgCollegtup utly authentication
2. **colleges**- College/oganization information
3. **subjct** - Subject managmet with hat room intgration4567. **chat_materials** - File/material sharing with metadata
8. **chat_assignments** - Assignment management
9101112nd idex
- `subjects`: `{ facultyI:1, collegeId: 1, chatRoomId: 1 }` - Faculty subject ing🎓Rol-Baed Access Cotroler Roles

1. **Adm** - Full system access
   - User manaement(creae HOD, Faculty, Students)
   - College management
   - View all users wit college/department info
   - System configuration

2. **HOD** - Department-level access
   - Manag faculty andstudnt in departmen
   -reate subjects and assignments
   - Upoad materals for departm3 **Faculty** - Subject-level access
  - Create and manage subjects
   - Upload and manage materials
   - e roll number rnges fo maerialaccess
   - Delee own materials

4. **Student** - Limited access
   - View assigned materials
   - Filter by roll number range
   - Download accessible files

## 💬 Cat RplySytem

### Enhanced Reply Fatues

- **👤 Send Names** Shows actual username of person being replied to
- **📝 MessageCotext**: Dislays original essage content
- **🎯Viual Indication**: Clear reply formating with quoted content
- **❌ Cncel Option**: Clea reply conext when needed- **🔗 Message Linking**: Replies linked to original messages

### Reply Flow

1. **Click Reply** on any message
**Context Display**: Shows "Username: riginal message..."
3. **Ty Respose**:Int fied focused automatally
4. **Send Reply**: Includes quoted orgial message with senr name
5. **Display**: Reply shows original sender contet clearly

## 📚 Materials Management

### Faculty Features

- **📁 Subject Creation**: Create subjects with roll number ranges
- **💾 Material Upload**: Upload files wit metadata
- **🎯 Roll Filtering**: Se access by roll nuber ranges
- **✏️ Edit/Deete**: Manage ownmaterals
- **🏫 College Ifo**:Displa college and classroom details
- **💬 Chat Integration**: Materials linked to chat roms

### Student Feates

- **📖Bwse Materials**: Vie accessible material
- **🔍 Roll Filtering**: See only matrials for yourll ange
- **📊Statitics**: Viw mateial accssstats
- **⬇️ Download**: Access allowed fles

## 🧪 Tesing

###Usng Test Client

1. Strtthe server: `nm stat`
2. Opn `public/index.html` in your brower6. **Reply Functionality**: Test reply with sender names7. **Material Upload**: Test file sharing via faculty dashboard

JWT-badwihrolviictioRl-aedaccss control ndpitdforcss-origin requests
- **File Uload**: Scue file handingwithtye valiaDaabascrypEnd-to-ndrypmpnttinAvacetrics dashboard
- [ ] Mobil app inegation
- [ ] Video/audo alling upporties
- **File Upload**: Optimzed matrial torage and retrievald duimamn