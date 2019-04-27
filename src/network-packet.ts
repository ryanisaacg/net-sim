import Address from './address'

class NetworkPacket {
    source: Address;
    dest: Address;
    payload: string;
    progress: number;
    distanceTraveled: number;

    constructor(source: Address, dest: Address, payload: string) {
        this.source = source;
        this.dest = dest;
        this.payload = payload;
        this.progress = 0;
        this.distanceTraveled = 0;
    }
}

export default NetworkPacket;
