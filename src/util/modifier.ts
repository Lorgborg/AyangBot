/**
 * 
 * returns the modifier
 */
export function getModifier (modifier: number): number {
    return Math.floor(Math.round(modifier-10)/2)
}