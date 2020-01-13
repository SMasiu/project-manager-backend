export const mapGetOptions = ({limit, offset}) => {
    if(!limit || limit > 50) {
        limit = 25;
    }

    if(!offset) {
        offset = 0;
    }

    return {limit, offset};
}