# Import packages
from gensim.models.doc2vec import Doc2Vec, TaggedDocument
from gensim.utils import simple_preprocess
from nltk.tokenize import word_tokenize
import nltk
import pandas as pd
import glob
from nltk.tokenize import RegexpTokenizer
from nltk.corpus import stopwords
from nltk.stem.porter import PorterStemmer
from gensim.models.doc2vec import TaggedDocument
import re

path = r'./Data'  # use your path
file_path_list = glob.glob(path + "/*.csv")

file_iter = iter(file_path_list)

list_df_csv = []
list_df_csv.append(pd.read_csv(next(file_iter)))

for file in file_iter:
    list_df_csv.append(pd.read_csv(file, header=0))
fdf = pd.concat(list_df_csv, ignore_index=True)

# run this every first time run of the day
# nltk.download("punkt")
# nltk.download('stopwords')
# Exapmple document (list of sentences)

df = fdf[["overview", "id", "genres"]]

df.rename(columns={'genres': 'genre'}, inplace=True)


def advanced_preprocess(text):
    tokenizer = RegexpTokenizer(r'\w+')

    en_stop = set(stopwords.words('english'))

    p_stemmer = PorterStemmer()

    # clean and tokenize document string
    raw = text.lower()

    tokens = tokenizer.tokenize(raw)

    # remove stop words from tokens
    stopped_tokens = [i for i in tokens if not i in en_stop]

    # remove numbers
    number_tokens = [re.sub(r'[\d]', ' ', i) for i in stopped_tokens]

    number_tokens = ' '.join(number_tokens).split()

    # stem tokens
    stemmed_tokens = [p_stemmer.stem(i) for i in number_tokens]

    # remove empty
    length_tokens = [i for i in stemmed_tokens if len(i) > 1]

    return length_tokens


class MyDataframeCorpus(object):
    def __init__(self, source_df, overview_col, id_col):
        self.source_df = source_df
        self.data_col = overview_col
        self.tag_col = id_col

    def __iter__(self):
        for i, row in self.source_df.iterrows():
            yield TaggedDocument(words=advanced_preprocess(row[self.data_col]),
                                 tags=[row[self.tag_col]])

# run when u want to create a new model
#tagged_data= list(MyDataframeCorpus(df, 'overview', 'id'))

# for obj in MyDataframeCorpus(df, 'overview', 'id'):
#   tagged_data.append(obj)

#model = Doc2Vec(tagged_data, vector_size=100, window=2, min_count=1, workers=4, epochs = 100)

# add shuffle

# Save trained doc2vec model
# model.save("test_doc2vec.model")
###


# Load saved doc2vec model
model = Doc2Vec.load("test_doc2vec.model")


# find most similar doc
#test_doc = advanced_preprocess("In order to save her terminally ill daughter, Lynch joined the adventure team consisting of the richest Qi Teng, the medical expert Ruo Ruo, the geologist fat man and the mercenary group, and embarked on a journey to find the ""fruit of life"". In this dangerous jungle, the dangers followed, and the players died in succession, and the dark places seemed to lurk in the fierce beasts of their lives. The relationship between the team members who want to escape and Saito becomes more and more tense. At the same time, the flower of life is about to open, and the true face of the mysterious beast is also surfaced".lower())


vector = []

for id in df["id"]:
    vector.append(str(model.docvecs[id]))

df = df.assign(vector=vector)

df.to_csv('./TrainingData.csv')

df
# fdf
# model.docvecs.index2entity
