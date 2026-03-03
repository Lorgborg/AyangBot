import axios, { AxiosResponse } from "axios"
import 'dotenv/config'
import * as champions from "./champion.json"

export function championByKey(id: string){
    return Object.values(champions.data)
        .find(champ => champ.key === id);
}


// could maybe handle res bad response here??
async function call(path: string, region: string="asia"): Promise<AxiosResponse>{
    const root = `https://${region}.api.riotgames.com`
    const res = await axios.get(root+path, {
        headers: {
            "X-Riot-Token": process.env.leagueAPI
        }
    })
    return res
}

export function tagToId(name: string, id: string): Promise<AxiosResponse>{
    return call(`/riot/account/v1/accounts/by-riot-id/${name}/${id}`);
}

export function idToHighestMastery(id: string): Promise<AxiosResponse> {
    return call(`/lol/champion-mastery/v4/champion-masteries/by-puuid/${id}/top`, "sg2")
}

export function idToMatch(id: string, count:string ="3"): Promise<AxiosResponse>{
    return call(`/lol/match/v5/matches/by-puuid/${id}/ids?start=0&count=${count}`, "sea")
}

export function matchIdToMatches(matchId: string): Promise<AxiosResponse>{
    return call(`/lol/match/v5/matches/${matchId}`, "sea")
}

export function idToSummoner(id: string): Promise<AxiosResponse>{
    return call(`/lol/summoner/v4/summoners/by-puuid/${id}`, "sg2")
}


// const user = await tagToId("ILoveBeyonce", "1FAN")
// console.log(user)
// // const highestMastery = await idToHighestMastery(user.puuid)
// const match = await idToMatch(user.puuid)
// const matchDetails = await matchIdToMatches(match[0])

// console.log(matchDetails)

// const champId = highestMastery[0].championId
// console.log(championByKey(`${champId}`))
