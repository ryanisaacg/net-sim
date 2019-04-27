// Addr: region.local.institution.node
// Region: scale of continents (NA, EU, RU, EA)
// Local: scale of nations or states (New Jersey, Spain)
// Institution: Connection to wider network (household, university, work)
// Node: The specific host
class Address {
    region: number;
    local?: number;
    institution?: number;
    node?: number;

    constructor(region: number, local?: number, institution?: number, node?: number) {
        this.region = region;
        this.local = local;
        this.institution = institution;
        this.node = node;
    }

    isChild(other: Address) {
        return this.region == other.region &&
            (!this.local || this.local == other.local) &&
            (!this.institution || this.institution == other.institution) &&
            (!this.node || this.node == other.node)
    }

    equals(other: Address) {
        return this.region == other.region &&
            this.local == other.local &&
            this.institution == other.institution &&
            this.node == other.node
    }
}

export default Address
