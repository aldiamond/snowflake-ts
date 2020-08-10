export type SchemaDefinition = {
    table: string;
    mappings: { [key: string]: string };
};

export class SchemaStore {
    private static store: { [key: string]: { mappings: { [key: string]: string } } } = {}
    private static tableStore: { [key: string]: string } = {}

    public static pushTable(ctr: Function, value: string): void {
        SchemaStore.tableStore[ctr.name] = value
    }

    public static pushColumnMapping(ctr: Function, columnKey: string, columnName: string) {
        const mapping = SchemaStore.store[ctr.name] || {}
        mapping.mappings = mapping.mappings || {}
        mapping.mappings[columnKey] = columnName
        SchemaStore.store[ctr.name] = mapping
    }

    public static getSchema(ctr: Function): SchemaDefinition {
        const table = SchemaStore.tableStore[ctr.name]
        return Object.assign({}, SchemaStore.store[ctr.name], { table })
    }
}

export const Table: (name: string) => ClassDecorator = name => {
    return (target: Function) => {
        SchemaStore.pushTable(target, name)
    }
}

export const Column: (name: string) => PropertyDecorator = (name: string) => {
    return function (target: Record<string, any>, property: string | symbol): void {
        SchemaStore.pushColumnMapping(target.constructor, property.toString(), name.toUpperCase())
    }
}