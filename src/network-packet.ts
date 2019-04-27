class NetworkPacket {
    source: Address;
    dest: Address;
    ttl: number;
    payload: any;
    progress: number;

    constructor(source: Address, dest: Address, ttl: number, payload: any) {
        this.source = source;
        this.dest = dest;
        this.ttl = ttl;
        this.payload = payload;
        this.progress = 0;
    }
}

