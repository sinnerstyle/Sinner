document.addEventListener('DOMContentLoaded', function () {

    // --- CONFIGURATION ---
    const config = {
        sheetUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vThs9RopNxmax2tjqFBvjU3QdA07hISEzwOTL9uMsfolujSimOZMN6md3mdGoq0FXZqiX6TCgqK3Os5/pub?output=csv',
        columnsPerRow: 2,
        itemsPerPage: 12 
    };
    // --- END CONFIGURATION ---

    const memberSections = document.querySelectorAll('.member-section');
    memberSections.forEach(section => {
        section.style.gridTemplateColumns = `repeat(${config.columnsPerRow}, 1fr)`;
    });

    const landingPage = document.getElementById('landing-page');
    const membersPage = document.getElementById('members-page');
    const enterBtn = document.getElementById('enter-btn');
    const backToHomeBtn = document.getElementById('back-to-home-btn');
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
                    <h3>${name}</h3>
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

            const leaders = membersData.filter(m => m.role.toLowerCase() === 'leader');
            const members = membersData.filter(m => m.role.toLowerCase() === 'member').sort((a, b) => a.name.localeCompare(b.name));
            
            leaderContainer.innerHTML = '';
            membersContainer.innerHTML = '';

            if (leaders.length > 0) {
                const leadersHTML = leaders.map(leader => createMemberCardHTML(leader, true)).join('');
                leaderContainer.innerHTML = '<h2><i class="fa-solid fa-crown"></i> LEADER</h2>' + leadersHTML;
            }

            if (members.length > 0) {
                const membersHTML = members.map(member => createMemberCardHTML(member)).join('');
                membersContainer.innerHTML = '<h2><i class="fa-solid fa-users-gear"></i> MEMBERS</h2>' + membersHTML;
            } else {
                membersContainer.innerHTML = '<h2><i class="fa-solid fa-users-gear"></i> MEMBERS</h2><p>No members found.</p>';
            }
            
            loadingMessage.style.display = 'none';
            initializePageFunctionality();

        } catch (error) {
            console.error('Error fetching/parsing data:', error);
            loadingMessage.style.display = 'none';
            membersContainer.innerHTML = '<h2>Error</h2><p>Error loading data. Please check settings.</p>';
        }
    }
    
    function initializePageFunctionality() {
        const searchInput = document.getElementById('searchInput');
        const allCards = Array.from(document.querySelectorAll('.member-card'));
        const paginationControls = document.querySelector('.pagination-controls');
        
        // --- 3D Hover Effect ---
        allCards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const rotateY = -1 * ((x - rect.width / 2) / (rect.width / 2)) * 8; // Max rotation 8deg
                const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * 8;
                card.style.transform = `translateY(-5px) perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
            });
        });

        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const pageInfo = document.getElementById('pageInfo');
        const itemsPerPage = config.itemsPerPage;
        let currentPage = 1;

        function updateView() {
            const filterText = searchInput.value.toLowerCase();
            const filteredCards = allCards.filter(card => card.dataset.name.toLowerCase().includes(filterText));
            const totalPages = Math.ceil(filteredCards.length / itemsPerPage);

            allCards.forEach(card => card.style.display = 'none');

            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const cardsToShow = filteredCards.slice(startIndex, endIndex);
            cardsToShow.forEach(card => card.style.display = 'flex');

            if (totalPages > 1) {
                paginationControls.style.display = 'flex';
                pageInfo.textContent = `${currentPage} / ${totalPages}`;
                prevBtn.disabled = (currentPage === 1);
                nextBtn.disabled = (currentPage >= totalPages);
            } else {
                paginationControls.style.display = 'none';
            }

            // --- ซ่อน/แสดงหัวข้อตอนค้นหา ---
            const leaderHeading = document.querySelector('#leader-section h2');
            const membersHeading = document.querySelector('#members-section h2');

            if (leaderHeading) {
                const hasVisibleLeaders = !!document.querySelector('#leader-section .member-card[style*="display: flex"]');
                leaderHeading.style.display = hasVisibleLeaders ? 'flex' : 'none';
            }
            if (membersHeading) {
                const hasVisibleMembers = !!document.querySelector('#members-section .member-card[style*="display: flex"]');
                membersHeading.style.display = hasVisibleMembers ? 'flex' : 'none';
            }
        }

        searchInput.addEventListener('input', () => { currentPage = 1; updateView(); });
        nextBtn.addEventListener('click', () => { if(currentPage < Math.ceil(allCards.filter(c => c.dataset.name.toLowerCase().includes(searchInput.value.toLowerCase())).length / itemsPerPage)) currentPage++; updateView(); });
        prevBtn.addEventListener('click', () => { if(currentPage > 1) currentPage--; updateView(); });
        
        updateView();
    }
    
    function setupAudioPlayer() {
        const audio = document.getElementById('gang-music');
        const playPauseBtn = document.getElementById('play-pause-btn');
        const playIcon = playPauseBtn.querySelector('i');
        const muteBtn = document.getElementById('mute-btn');
        const muteIcon = muteBtn.querySelector('i');
        const volumeSlider = document.getElementById('volume-slider');

        playPauseBtn.addEventListener('click', () => audio.paused ? audio.play() : audio.pause());
        audio.addEventListener('play', () => playIcon.classList.replace('fa-play', 'fa-pause'));
        audio.addEventListener('pause', () => playIcon.classList.replace('fa-pause', 'fa-play'));
        volumeSlider.addEventListener('input', (e) => {
            audio.volume = e.target.value;
            audio.muted = e.target.value == 0;
        });
        audio.addEventListener('volumechange', () => {
            volumeSlider.value = audio.volume;
            if (audio.muted || audio.volume === 0) muteIcon.className = 'fas fa-volume-xmark';
            else if (audio.volume < 0.5) muteIcon.className = 'fas fa-volume-low';
            else muteIcon.className = 'fas fa-volume-high';
        });
        muteBtn.addEventListener('click', () => audio.muted = !audio.muted);
        audio.volume = 0.1;
    }

    enterBtn.addEventListener('click', () => {
        landingPage.style.animation = 'fadeOut 0.5s forwards';
        setTimeout(() => {
            landingPage.style.display = 'none';
            membersPage.style.display = 'block';
            membersPage.style.animation = 'fadeIn 1s forwards';
            
            const audio = document.getElementById('gang-music');
            const playIcon = document.querySelector('#play-pause-btn i');
            
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    playIcon.classList.replace('fa-play', 'fa-pause');
                }).catch(error => {
                    console.error("Autoplay was prevented:", error);
                });
            }

            fetchAndDisplayMembers();
        }, 500);
    });

    backToHomeBtn.addEventListener('click', () => {
        membersPage.style.animation = 'fadeOut 0.5s forwards';
        setTimeout(() => {
            membersPage.style.display = 'none';
            landingPage.style.display = 'flex';
            landingPage.style.animation = 'fadeIn 1s forwards';
            const audio = document.getElementById('gang-music');
            if (!audio.paused) {
                audio.pause();
            }
        }, 500);
    });
    
    setupAudioPlayer();
});