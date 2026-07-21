from fastapi import APIRouter

router = APIRouter(
    prefix="/fir",
    tags=["FIR"]
)


@router.post("/")
def create_fir():
    return {
        "message": "FIR API Working"
    }