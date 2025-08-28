import { Link } from "@tanstack/react-router";
import { Button } from "./ui/button";

export default function ErrorComponent({ error }) {
	console.log(error.data);
	return (
		<article className="w-full h-dvh grid place-items-center">
			<section className="text-center space-y-8">
				<h1 className="text-9xl text-foreground font-bold">
					{error.data.httpStatus} Error
				</h1>
				<p className="text-2xl font-light">
					An error has occurred with the message: {error.data.code}
				</p>
				<Link to="..">
					<Button>Go Back</Button>
				</Link>
			</section>
		</article>
	);
}
