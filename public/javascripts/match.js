
  async function fetchAndUpdateMatches() {
    try {
      const res = await fetch('/match-data');
      const data = await res.json();

      const matchList = document.getElementById('match-list');
      matchList.innerHTML = '';

      data.forEach(match => {
        const card = document.createElement('div');
        card.className = 'bg-gray-800 p-6 rounded-lg shadow-md border border-green-400';

        card.innerHTML = `
          <h3 class="text-xl font-semibold text-white">${match.teamname}</h3>
          <p class="text-gray-400 mt-2">📅 Date: ${new Date(match.date).toLocaleDateString()}</p>
          <p class="text-gray-400 mt-2">⏰ Time: ${new Date(match.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          <p class="text-gray-400 mt-2">📍 Location: ${match.location}</p>
          ${
            match.joinedBy
              ? `<p class="text-green-400 mt-4">✅ Joined By: ${match.joinedBy}</p>`
              : (match.teamname === currentUserTeam)

                ? `<p class="text-blue-400 mt-4">You created this match.</p>`
                : `
                    <p class="text-yellow-400 mt-4">⏳ Match Pending...</p>
                    <form action="/join-match/${match._id}" method="POST">
                      <button class="mt-2 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded text-white font-bold">Join Match</button>
                    </form>
                    
                    `
                  }
                <form action="/match-details %>" method="POST">
                    <button class="mt-2 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded text-white font-bold">
                    Show Details
                    </button>
                    </form>
        `;

        matchList.appendChild(card);
      });

    } catch (err) {
      console.error('Error fetching matches:', err);
    }
  }

  // Silent refresh every 10 seconds
  setInterval(fetchAndUpdateMatches, 10000);

