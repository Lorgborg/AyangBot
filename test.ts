// import axios, { AxiosResponse } from "axios"
// import 'dotenv/config'
// const root = "https://asia.api.riotgames.com"

// type res = AxiosResponse
// console.log(process.env.leagueAPI)
// axios.get<res>(root+'/riot/account/v1/accounts/by-riot-id/ILoveBeyonce/1FAN', {
//     headers: {
//         "X-Riot-Token": process.env.leagueAPI
//     }
// }).then(res => {
//     const casted: res = res;
//     console.log(casted.data);
//     const jsonParsed = JSON.parse(casted.data);
//     console.log(jsonParsed)
// })

// const username = "ILoveBeyonce#1FAN"

// const partition = username.split("#")
// console.log(partition[1])

/**
 Do not return anything, modify nums1 in-place instead.
 */
function merge(nums1: number[], m: number, nums2: number[], n: number): void {
    const merged: number[] = [];
    let n1 = 0, n2 = 0;
    for(let i = 0; i <= m+n; i++) {
        if(nums1[n1] <= nums2[n2]) {
            merged.push(nums1[n1])
            n1++
        } else {
            merged.push(nums2[n2])
            n2++
        }
    }
    console.log(merged)
}

merge([1,2,3,0,0,0], 3, [2,5,6], 3)