import InputForm from "../Elements/input";
import Button from "../Elements/Button"

const FormLogin = ()=> {
    return (
        <form action="">
        <InputForm 
        label="Email" 
        type="email" 
        placeholder="example@mail.com" 
        name="email"
        />
          <InputForm
          label="password"
          type="password" 
          className="text-sm border rounded w-full py-2 px-3 text-slate-700 placeholder:opacity-50"
          placeholder="********"
          name="password"
          />
      
        <Button classname="bg-blue-600 w-full">Login</Button>
      </form>
    )
     
};

export default FormLogin;