document.addEventListener('DOMContentLoaded', function () {

    // --- CONFIGURATION (ปรับแต่งหน้าตาและการทำงานของเว็บที่นี่) ---
    const config = {
        // Link ของ Google Sheet ที่เผยแพร่เป็น CSV
        sheetUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vThs9RopNxmax2tjqFBvjU3QdA07hISEzwOTL9uMsfolujSimOZMN6md3mdGoq0FXZqiX6TCgqK3Os5/pub?output=csv',
        
        // จำนวนคอลัมน์ (จำนวนคนในแต่ละแถว)
        columnsPerRow: 2,

        // จำนวนสมาชิกทั้งหมดที่จะแสดงในแต่ละหน้า (จะถูกนำไปคำนวณเป็นจำนวนแถว)
        // เช่น 15 หาร 3 คอลัมน์ = 5 แถว
        itemsPerPage: 12 
    };
    // --- END CONFIGURATION ---


    // --- Apply Layout Settings from Config ---
    // โค้ดส่วนนี้จะนำค่าจาก config ไปสั่งให้ CSS ทำงาน
    const memberSections = document.querySelectorAll('.member-section');
    memberSections.forEach(section => {
        section.style.gridTemplateColumns = `repeat(${config.columnsPerRow}, 1fr)`;
    });
    // --- End Apply Layout ---


    const landingPage = document.getElementById('landing-page');
    const membersPage = document.getElementById('members-page');
    const enterBtn = document.getElementById('enter-btn');
    const leaderContainer = document.querySelector('#leader-section');
    const membersContainer = document.querySelector('#members-section');
    const loadingMessage = document.getElementById('loading-message');

    function createMemberCardHTML(member, isLeader = false) {
        const cardClass = isLeader ? 'member-card leader-card' : 'member-card';
        const name = member.name || 'Unknown';
        const facebookLink = member.facebookLink || '#';
        const pictureLink = member.pictureLink || 'https://via.placeholder.com/150';
        
        let shortLink = 'No Profile';
        if (facebookLink !== '#') {
            try {
                const url = new URL(facebookLink);
                shortLink = url.hostname.replace('www.', '') + (url.pathname.length > 1 ? url.pathname : '');
            } catch (e) {
                shortLink = facebookLink.replace(/^https?:\/\//, '');
            }
        }
        
        return `
            <div class="${cardClass}" data-name="${name}">
                <img src="${pictureLink}" alt="Profile of ${name}" class="profile-pic">
                <div class="member-info">
                    <h3 class="memberName">${name}</h3>
                    <a href="${facebookLink}" target="_blank" rel="noopener noreferrer">${shortLink}</a>
                </div>
                <a href="${facebookLink}" target="_blank" rel="noopener noreferrer" class="profile-link"><i class="fab fa-facebook-f"></i></a>
            </div>
        `;
    }

    async function fetchAndDisplayMembers() {
        try {
            loadingMessage.style.display = 'block';
            const response = await fetch(config.sheetUrl);
            if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
            const csvText = await response.text();
            
            const rows = csvText.trim().split(/\r?\n/);
            const headers = rows.shift().split(',').map(h => h.trim());
            
            const membersData = rows.map(row => {
                const values = row.split(',');
                return {
                    name: values[0]?.trim() || '',
                    facebookLink: values[1]?.trim() || '',
                    role: values[2]?.trim() || '',
                    pictureLink: values[3]?.trim() || ''
                };
            }).filter(m => m.name);

            const leaders = membersData
                .filter(m => m.role.toLowerCase() === 'leader');

            const members = membersData
                .filter(m => m.role.toLowerCase() === 'member')
                .sort((a, b) => a.name.localeCompare(b.name));
            
            leaderContainer.innerHTML = '';
            membersContainer.innerHTML = '';

            if (leaders.length > 0) {
                const leadersHTML = leaders.map(leader => createMemberCardHTML(leader, true)).join('');
                leaderContainer.innerHTML = '<h2>👑 LEADER</h2>' + leadersHTML;
            }

            if (members.length > 0) {
                const membersHTML = members.map(member => createMemberCardHTML(member)).join('');
                membersContainer.innerHTML = '<h2><i class="fas fa-users"></i> MEMBERS</h2>' + membersHTML;
            } else {
                membersContainer.innerHTML = '<h2><i class="fas fa-users"></i> MEMBERS</h2><p>No members found.</p>';
            }
            
            loadingMessage.style.display = 'none';
            initializePageFunctionality();

        } catch (error) {
            console.error('Error fetching or parsing sheet data:', error);
            loadingMessage.style.display = 'none';
            membersContainer.innerHTML = '<h2>⚔️ MEMBERS</h2><p>Error loading data. Please check the Google Sheet link and publish settings.</p>';
        }
    }
    
    function initializePageFunctionality() {
        const searchInput = document.getElementById('searchInput');
        const memberCards = Array.from(document.querySelectorAll('#members-section .member-card'));
        
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const pageInfo = document.getElementById('pageInfo');
        const paginationControls = document.querySelector('.pagination-controls');
        const leaderSection = document.getElementById('leader-section');
        const itemsPerPage = config.itemsPerPage;
        let currentPage = 1;
        
        function updateView() {
            const filterText = searchInput.value.toLowerCase();
            
            const filteredCards = memberCards.filter(card => {
                const memberName = card.dataset.name.toLowerCase();
                return memberName.includes(filterText);
            });

            const totalPages = Math.ceil(filteredCards.length / itemsPerPage);
            
            memberCards.forEach(card => card.style.display = 'none');

            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            
            const cardsToShow = filteredCards.slice(startIndex, endIndex);
            cardsToShow.forEach(card => card.style.display = 'flex');
             
            const isSearching = filterText.length > 0;
            if (isSearching || currentPage > 1) {
                leaderSection.style.display = 'none';
            } else {
                leaderSection.style.display = 'grid';
            }

            if (totalPages > 1) {
                paginationControls.style.display = 'flex';
                pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
                prevBtn.disabled = (currentPage === 1);
                nextBtn.disabled = (currentPage >= totalPages);
            } else {
                paginationControls.style.display = 'none';
            }
        }

        searchInput.addEventListener('input', () => { 
            currentPage = 1; 
            updateView(); 
        });

        nextBtn.addEventListener('click', () => { 
            currentPage++; 
            updateView(); 
        });

        prevBtn.addEventListener('click', () => { 
            currentPage--; 
            updateView(); 
        });
        
        updateView();
    }
    
    function setupAudioPlayer() {
        const audio = document.getElementById('gang-music');
        const playPauseBtn = document.getElementById('play-pause-btn');
        const playIcon = playPauseBtn.querySelector('i');
        const muteBtn = document.getElementById('mute-btn');
        const muteIcon = muteBtn.querySelector('i');
        const volumeSlider = document.getElementById('volume-slider');

        playPauseBtn.addEventListener('click', () => {
            audio.paused ? audio.play() : audio.pause();
        });

        audio.addEventListener('play', () => {
            playIcon.classList.replace('fa-play', 'fa-pause');
        });

        audio.addEventListener('pause', () => {
            playIcon.classList.replace('fa-pause', 'fa-play');
        });

        volumeSlider.addEventListener('input', (e) => {
            audio.volume = e.target.value;
            audio.muted = false;
        });

        audio.addEventListener('volumechange', () => {
            volumeSlider.value = audio.volume;
            if (audio.muted || audio.volume === 0) {
                muteIcon.className = 'fas fa-volume-xmark';
            } else if (audio.volume < 0.5) {
                muteIcon.className = 'fas fa-volume-low';
            } else {
                muteIcon.className = 'fas fa-volume-high';
            }
        });
        
        muteBtn.addEventListener('click', () => {
            audio.muted = !audio.muted;
        });
        
        audio.volume = 0.1;
    }

    enterBtn.addEventListener('click', () => {
        landingPage.style.animation = 'fadeOut 0.5s forwards';
        setTimeout(() => {
            landingPage.style.display = 'none';
            membersPage.style.display = 'block';
            membersPage.style.animation = 'fadeIn 1s forwards';
            
            const audio = document.getElementById('gang-music');
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error("Autoplay was prevented:", error);
                });
            }
            fetchAndDisplayMembers();
        }, 500);
    });
    
    setupAudioPlayer();
});