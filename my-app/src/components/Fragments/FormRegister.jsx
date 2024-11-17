import InputForm from "../Elements/input";
import Button from "../Elements/Button"

const FormRegister = () => {
    return (
        <form action="">
            <div className="">
                <InputForm
                    label="Fullname"
                    type="text"
                    placeholder="insert your name here.."
                    name="fullname"
                />
                <InputForm
                    label="Email"
                    type="email"
                    placeholder="example@mail.com"
                    name="email"
                />
                <InputForm
                    label="password"
                    type="password"
                    placeholder="********"
                />
                <InputForm
                    label="Confirm Password"
                    type="password"
                    placeholder="********"
                    name="confermPassword"
                />
                <Button classname="bg-blue-600 w-full">Register</Button>
            </div>
        </form>
    )

};

export default FormRegister;