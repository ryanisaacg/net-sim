class NetworkPacket {
    source: Address;
    dest: Address;
    born: number;
    lifetime: number;
    option: NetworkPacketOptions;
    payload: any;
}

enum NetworkPacketOptions {
    Connect,
    Data,
}
