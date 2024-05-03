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




const populateData = async (tourneyId, tourneyData, playerData) => {
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
            tourneyData[tourneyId].winner = player.display_name;
    		if (player.display_name in playerData) {
    			playerData[player.display_name].gold += 1
    		} else if (player.email_hash in playerData) {
                playerData[player.email_hash].gold += 1
            } else if (player.email_hash) {
    			playerData[player.email_hash] = {
    				...dummyPlayer,
    				name: player.display_name,
    				gold: 1,
    			}
    		} else {
                playerData[player.display_name] = {
                    ...dummyPlayer,
                    name: player.display_name,
                    gold: 1,
                }
            }
    	}
    	else if (player.final_rank == 2) {
    		if (player.display_name in playerData) {
                playerData[player.display_name].silver += 1
            } else if (player.email_hash in playerData) {
                playerData[player.email_hash].silver += 1
            } else if (player.email_hash) {
    			playerData[player.email_hash] = {
    				...dummyPlayer,
    				name: player.display_name,
    				silver: 1,
    			}
    		} else {
                playerData[player.display_name] = {
                    ...dummyPlayer,
                    name: player.display_name,
                    silver: 1,
                }
            }
    	}
    	else if (player.final_rank == 3) {
    		if (player.display_name in playerData) {
                playerData[player.display_name].bronze += 1
            } else if (player.email_hash in playerData) {
                playerData[player.email_hash].bronze += 1
            } else if (player.email_hash) {
    			playerData[player.email_hash] = {
    				...dummyPlayer,
    				name: player.display_name,
    				bronze: 1,
    			}
    		} else {
                playerData[player.display_name] = {
                    ...dummyPlayer,
                    name: player.display_name,
                    bronze: 1,
                }
            }
    	}
    })

}

app.get('/api/tournaments', async (req, res) => {
	const json = await axios.get(`https://api.challonge.com/v1/tournaments.json?api_key=${CHALLONGE_API_KEY}`)

    const tourneyData = {}

    // dummy player and tourney data to try to avoid need for a ton of API calls
    // medals are array of tourney ids
    // 231341: { // playerId as key
    //  name: "Postal",
    //  gold: 1,
    //  silver: 0,
    //  bronze: 0
    // }
    let playerData = {}

	for (let {tournament} of json.data) {
        tourneyData[tournament.id] = {
            winner: "",
            name: tournament.name,
            url: tournament.url,
            state: tournament.state,
            started_at: tournament.started_at,
            completed_at: tournament.completed_at,
        }
		await populateData(tournament.id, tourneyData, playerData);
	};

	return res.json({...tourneyData, hof: playerData});
});

app.get("/", (req,res) => {
    return res.send("Site is up")
})

app.listen(PORT, () => {
	console.log(`App listening on PORT ${PORT}`);
})
