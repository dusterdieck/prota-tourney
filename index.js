require("dotenv").config();
const express = require('express')
const path = require("path")
const axios = require("axios")
const cors = require('cors')



const app = express();
const PORT = process.env.PORT || 3000;
const CHALLONGE_API_KEY = process.env.CHALLONGE_API_KEY;

// Sets up the Express app to handle data parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors())

// dummy player and tourney data to try to avoid need for a ton of API calls
// medals are array of tourney ids
// 231341: { // playerId as key
// 	name: "Postal",
// 	gold: 1,
// 	silver: 0,
// 	bronze: 0
// }
let playerData = {}

const populateData = async (tourneyId, tourneyData) => {
    console.log("hit challonge api", tourneyId)
	const json = await axios.get(`https://api.challonge.com/v1/tournaments/${tourneyId}.json?api_key=${CHALLONGE_API_KEY}&include_participants=1`)

	const dummyPlayer = {
		name: "",
		gold: 0,
		silver: 0,
		bronze: 0,
	}

    json.data.tournament.participants.forEach(p => {
    	const player = p.participant;
    	if (player.final_rank == 1) {
            tourneyData[tourneyId].winner = player.name;
    		if (player.id in playerData) {
    			playerData[player.id].gold += 1
    		} else {
    			playerData[player.id] = {
    				...dummyPlayer,
    				name: player.name,
    				gold: 1,
    			}
    		}
    	}
    	else if (player.final_rank == 2) {
    		if (player.id in playerData) {
    			playerData[player.id].silver += 1
    		} else {
    			playerData[player.id] = {
    				...dummyPlayer,
    				name: player.name,
    				silver: 1,
    			}
    		}
    	}
    	else if (player.final_rank == 3) {
    		if (player.id in playerData) {
    			playerData[player.id].bronze += 1
    		} else {
    			playerData[player.id] = {
    				...dummyPlayer,
    				name: player.name,
    				bronze: 1,
    			}
    		}
    	}
    })
}

app.get('/api/tournaments', async (req, res) => {
	const json = await axios.get(`https://api.challonge.com/v1/tournaments.json?api_key=${CHALLONGE_API_KEY}`)

    const tourneyData = {}

	for (let {tournament} of json.data) {
        tourneyData[tournament.id] = {
            winner: "",
            name: tournament.name,
            url: tournament.url,
            state: tournament.state,
            started_at: tournament.started_at,
            completed_at: tournament.completed_at,
        }
		await populateData(tournament.id, tourneyData);
	};

	return res.json(tourneyData);
});

app.get('/api/halloffame', (req, res) => {
	return res.json(playerData)
})

app.get("/", (req,res) => {
    return res.send("Site is up")
})

app.listen(PORT, () => {
	console.log(`App listening on PORT ${PORT}`);
})
