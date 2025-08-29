import { Link } from "@tanstack/react-router";
import { Button } from "./ui/button";

export default function ErrorComponent({ error }) {
	return (
		<article className="w-full h-dvh grid place-items-center">
			<section className="text-center space-y-8">
				<h1 className="text-9xl text-foreground font-bold">
					{error instanceof Error
						? error.message
						: error.data?.httpStatus || 500}
				</h1>
				<p className="text-2xl font-light">
					An error has occurred with the message:{" "}
					{error instanceof Error
						? error.message
						: error.data?.code || "Unknown Error"}
				</p>
				<Link to="..">
					<Button>Go Back</Button>
				</Link>
			</section>
		</article>
	);
}
