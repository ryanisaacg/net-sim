import Address from './address'

class NetworkPacket {
    source: Address;
    dest: Address;
    payload: any;
    progress: number;

    constructor(source: Address, dest: Address, payload: any) {
        this.source = source;
        this.dest = dest;
        this.payload = payload;
        this.progress = 0;
    }
}

export default NetworkPacket;
