export interface IPreparedQuery {
	name: string;
	text: string;
	values: Array<number | string | boolean>;
}
