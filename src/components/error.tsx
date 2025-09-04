import { Link } from "@tanstack/react-router";
import { Button } from "./ui/button";

export default function ErrorComponent({ error }) {
	return (
		<article className="w-full h-dvh grid place-items-center">
			<section className="text-center space-y-8 bg-destructive/20 p-4 rounded-md border-2 border-destructive/30">
				<h1 className="text-lg text-destructive font-bold text-start  overflow-x-scroll">
					An Error happened : with the following message:
				</h1>
				<pre className="bg-accent/20 rounded-sm p-2 border border-accent text-start">
					{error instanceof Error
						? error.message
						: error.data?.httpStatus || 500}
				</pre>
				<Link to="..">
					<Button variant="destructive">Go Back</Button>
				</Link>
			</section>
		</article>
	);
}
