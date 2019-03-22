class NetworkPacket {
    source: Address;
    dest: Address;
    born: number;
    lifetime: number;
    option: NetworkPacketOptions;
    payload: any;
    progress: number;
}

enum NetworkPacketOptions {
    Connect,
    Data,
}
